# kernels/fused_softmax.py
#
# Stage 3 — kernel fusion.
#
# PyTorch's softmax is really ~4 separate kernels under the hood: row
# max, subtract+exp, row sum, divide. Each one re-reads/writes the row
# from global memory. If the whole row fits in SRAM we can just load
# it once, do all four steps in registers, and write back once.
#
# python fused_softmax.py

import torch
import triton
import triton.language as tl


@triton.jit
def _softmax_kernel(
    out_ptr, in_ptr,
    in_row_stride,
    out_row_stride,
    n_cols,
    BLOCK_SIZE: tl.constexpr,  # needs to be >= n_cols, whole row in one block
):
    # one program per row — only works because rows here are small
    # enough (~1000 cols) to live comfortably in registers
    row_idx = tl.program_id(0)
    row_start_ptr = in_ptr + row_idx * in_row_stride

    col_offsets = tl.arange(0, BLOCK_SIZE)
    input_ptrs = row_start_ptr + col_offsets

    # BLOCK_SIZE is rounded up to a power of 2, so n_cols can be smaller
    mask = col_offsets < n_cols

    # -inf padding so those lanes never win the max and become 0 after exp
    row = tl.load(input_ptrs, mask=mask, other=-float("inf"))

    # everything below is in registers, no more DRAM traffic
    row_minus_max = row - tl.max(row, axis=0)  # stability trick
    numerator = tl.exp(row_minus_max)
    denominator = tl.sum(numerator, axis=0)
    softmax_out = numerator / denominator

    out_row_start_ptr = out_ptr + row_idx * out_row_stride
    output_ptrs = out_row_start_ptr + col_offsets
    tl.store(output_ptrs, softmax_out, mask=mask)


def fused_softmax(x: torch.Tensor) -> torch.Tensor:
    """x: (n_rows, n_cols), softmax over dim=1."""
    assert x.ndim == 2 and x.is_cuda
    n_rows, n_cols = x.shape

    BLOCK_SIZE = triton.next_power_of_2(n_cols)

    out = torch.empty_like(x)
    _softmax_kernel[(n_rows,)](
        out, x,
        x.stride(0), out.stride(0),
        n_cols,
        BLOCK_SIZE=BLOCK_SIZE,
    )
    return out


if __name__ == "__main__":
    torch.manual_seed(0)
    x = torch.randn(1823, 781, device="cuda")  # odd shape on purpose

    triton_out = fused_softmax(x)
    torch_out = torch.softmax(x, dim=1)

    max_diff = (triton_out - torch_out).abs().max().item()
    print(f"max diff vs torch: {max_diff}")
    assert torch.allclose(triton_out, torch_out, atol=1e-5)
    print("fused_softmax: correct")
