# kernels/vector_add.py
#
# Stage 2 — just getting the Triton programming model into my hands
# before touching anything real. Elementwise add, nothing fancy.
#
# python vector_add.py   (needs a CUDA GPU, torch + triton installed)

import torch
import triton
import triton.language as tl


@triton.jit
def _vector_add_kernel(
    x_ptr,
    y_ptr,
    out_ptr,
    n_elements,
    BLOCK_SIZE: tl.constexpr,  # constexpr -> baked in at compile time
):
    # each program instance = one block of BLOCK_SIZE elements.
    # program_id tells us which chunk we own.
    pid = tl.program_id(axis=0)
    block_start = pid * BLOCK_SIZE
    offsets = block_start + tl.arange(0, BLOCK_SIZE)

    # n_elements almost never divides evenly by BLOCK_SIZE, so the last
    # program will try to read/write past the end without this mask
    mask = offsets < n_elements

    x = tl.load(x_ptr + offsets, mask=mask)
    y = tl.load(y_ptr + offsets, mask=mask)

    result = x + y

    tl.store(out_ptr + offsets, result, mask=mask)


def vector_add(x: torch.Tensor, y: torch.Tensor) -> torch.Tensor:
    assert x.is_cuda and y.is_cuda, "tensors must be on GPU"
    out = torch.empty_like(x)
    n_elements = out.numel()

    # grid as a lambda so triton could autotune BLOCK_SIZE later if needed
    grid = lambda meta: (triton.cdiv(n_elements, meta["BLOCK_SIZE"]),)

    _vector_add_kernel[grid](x, y, out, n_elements, BLOCK_SIZE=1024)
    return out


if __name__ == "__main__":
    torch.manual_seed(0)
    size = 98_765  # not a multiple of 1024 on purpose, to hit the mask path
    x = torch.rand(size, device="cuda")
    y = torch.rand(size, device="cuda")

    triton_result = vector_add(x, y)
    torch_result = x + y

    max_diff = (triton_result - torch_result).abs().max().item()
    print(f"max diff vs torch: {max_diff}")
    assert torch.allclose(triton_result, torch_result)
    print("vector_add: correct")
