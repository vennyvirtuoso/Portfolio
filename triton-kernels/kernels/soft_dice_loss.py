# kernels/soft_dice_loss.py
#
# Stage 4 — applying fusion to something I actually use: Soft Dice
# Loss, the standard loss for segmentation (stroke lesion, vessel,
# tumor masks, etc).
#
#   Dice = (2 * intersection + eps) / (sum(pred) + sum(target) + eps)
#   loss = 1 - Dice
#
# Naive PyTorch does this as a multiply + three separate .sum() calls
# -- 4 kernel launches, and for something like a 512x1024x1024 DSA
# volume that's 4 full reads of a huge tensor from global memory.
# Fusing the multiply and all three reductions into one launch means
# we only read pred/target once.
#
# Why a 2D grid, unlike the softmax kernel: rows there were ~1000
# elements and fit in one block. A single slice here can be ~1M
# elements, way too big for one block's registers. So:
#   axis 0 = chunk across the flattened spatial dim (many blocks per
#            slice, cooperating)
#   axis 1 = which (batch, channel) slice
#   tl.atomic_add lets blocks on the same row safely accumulate into
#   the same output scalar, since one row no longer fits in one block
#
# python soft_dice_loss.py

import torch
import triton
import triton.language as tl


@triton.jit
def _soft_dice_kernel(
    pred_ptr, target_ptr,
    inter_ptr, pred_sum_ptr, target_sum_ptr,  # one scalar per row
    n_elements,  # elements in a single (batch, channel) slice
    BLOCK_SIZE: tl.constexpr,
):
    pid = tl.program_id(0)      # which spatial chunk
    row_id = tl.program_id(1)   # which mask (batch*channel)

    block_start = pid * BLOCK_SIZE
    offsets = block_start + tl.arange(0, BLOCK_SIZE)
    mask = offsets < n_elements

    base = row_id * n_elements
    pred = tl.load(pred_ptr + base + offsets, mask=mask, other=0.0)
    target = tl.load(target_ptr + base + offsets, mask=mask, other=0.0)

    # partial reductions for this chunk only
    inter = tl.sum(pred * target, axis=0)
    p_sum = tl.sum(pred, axis=0)
    t_sum = tl.sum(target, axis=0)

    # several (pid, row_id) programs share the same row_id output slot,
    # so this has to be atomic or we'd get a race
    tl.atomic_add(inter_ptr + row_id, inter)
    tl.atomic_add(pred_sum_ptr + row_id, p_sum)
    tl.atomic_add(target_sum_ptr + row_id, t_sum)


def fused_soft_dice_loss(pred: torch.Tensor, target: torch.Tensor, eps: float = 1e-6) -> torch.Tensor:
    """
    pred, target: (B, C, *spatial), already activated (sigmoid/softmax).
    Shape-agnostic (2D or 3D volumes) since we flatten everything past
    the first two dims.
    Returns scalar loss = 1 - mean(Dice) over all B*C slices.
    """
    assert pred.shape == target.shape and pred.is_cuda
    B_C = pred.shape[0] * pred.shape[1]
    n_elements = pred.numel() // B_C

    pred_flat = pred.contiguous().view(B_C, n_elements)
    target_flat = target.contiguous().view(B_C, n_elements)

    # has to start at zero, atomic_add accumulates onto whatever's there
    inter = torch.zeros(B_C, device=pred.device, dtype=torch.float32)
    pred_sum = torch.zeros(B_C, device=pred.device, dtype=torch.float32)
    target_sum = torch.zeros(B_C, device=pred.device, dtype=torch.float32)

    BLOCK_SIZE = 1024
    grid = (triton.cdiv(n_elements, BLOCK_SIZE), B_C)
    _soft_dice_kernel[grid](
        pred_flat, target_flat,
        inter, pred_sum, target_sum,
        n_elements, BLOCK_SIZE=BLOCK_SIZE,
    )

    dice = (2 * inter + eps) / (pred_sum + target_sum + eps)
    return 1.0 - dice.mean()


def naive_soft_dice_loss(pred: torch.Tensor, target: torch.Tensor, eps: float = 1e-6) -> torch.Tensor:
    """Plain PyTorch reference, for checking correctness against."""
    B_C = pred.shape[0] * pred.shape[1]
    pred_f = pred.contiguous().view(B_C, -1)
    target_f = target.contiguous().view(B_C, -1)
    inter = (pred_f * target_f).sum(dim=1)
    union = pred_f.sum(dim=1) + target_f.sum(dim=1)
    dice = (2 * inter + eps) / (union + eps)
    return 1.0 - dice.mean()


if __name__ == "__main__":
    torch.manual_seed(0)
    # stand-in for a batch of 2D lesion masks, similar shape to what I'd
    # get off the stroke segmentation stuff
    pred = torch.sigmoid(torch.randn(4, 1, 512, 512, device="cuda"))
    target = (torch.rand(4, 1, 512, 512, device="cuda") > 0.5).float()

    triton_loss = fused_soft_dice_loss(pred, target)
    naive_loss = naive_soft_dice_loss(pred, target)

    diff = (triton_loss - naive_loss).abs().item()
    print(f"triton: {triton_loss.item():.6f}  naive: {naive_loss.item():.6f}  diff: {diff}")
    assert torch.allclose(triton_loss, naive_loss, atol=1e-4)
    print("fused_soft_dice_loss: correct")
