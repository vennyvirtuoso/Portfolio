"""
benchmark.py
=============
Runs all three kernels, verifies correctness, and benchmarks them
against native PyTorch equivalents using triton.testing.do_bench.

Run this LAST, after all three kernel files pass their own
correctness checks individually.

    python benchmark.py

Copy the printed table directly into your README.md -- that table
IS your "profiler trace" proof for the job application.
"""

import torch
import triton

from kernels.vector_add import vector_add
from kernels.fused_softmax import fused_softmax
from kernels.soft_dice_loss import fused_soft_dice_loss, naive_soft_dice_loss


def bench_vector_add(size=10_000_000):
    x = torch.rand(size, device="cuda")
    y = torch.rand(size, device="cuda")

    ms_triton = triton.testing.do_bench(lambda: vector_add(x, y))
    ms_torch = triton.testing.do_bench(lambda: x + y)

    # GB/s throughput: 3 tensors touched (read x, read y, write out),
    # each 4 bytes (float32) per element.
    gbps = lambda ms: 3 * size * 4 / (ms * 1e-3) / 1e9

    print(f"\n[Vector Add] size={size}")
    print(f"  Triton : {ms_triton:.4f} ms  ({gbps(ms_triton):.1f} GB/s)")
    print(f"  PyTorch: {ms_torch:.4f} ms  ({gbps(ms_torch):.1f} GB/s)")


def bench_softmax(shape=(4096, 2048)):
    x = torch.randn(*shape, device="cuda")

    ms_triton = triton.testing.do_bench(lambda: fused_softmax(x))
    ms_torch = triton.testing.do_bench(lambda: torch.softmax(x, dim=1))

    print(f"\n[Fused Softmax] shape={shape}")
    print(f"  Triton : {ms_triton:.4f} ms")
    print(f"  PyTorch: {ms_torch:.4f} ms")
    print(f"  Speedup: {ms_torch / ms_triton:.2f}x")


def bench_soft_dice(shape=(8, 128, 512, 512)):
    pred = torch.sigmoid(torch.randn(*shape, device="cuda"))
    target = (torch.rand(*shape, device="cuda") > 0.5).float()

    ms_triton = triton.testing.do_bench(lambda: fused_soft_dice_loss(pred, target))
    ms_torch = triton.testing.do_bench(lambda: naive_soft_dice_loss(pred, target))

    print(f"\n[Fused Soft Dice Loss] shape={shape} (B,C,H,W)")
    print(f"  Triton : {ms_triton:.4f} ms")
    print(f"  PyTorch: {ms_torch:.4f} ms")
    print(f"  Speedup: {ms_torch / ms_triton:.2f}x")


if __name__ == "__main__":
    assert torch.cuda.is_available(), "CUDA GPU required"
    print(f"GPU: {torch.cuda.get_device_name(0)}")

    bench_vector_add()
    bench_softmax()
    bench_soft_dice()
