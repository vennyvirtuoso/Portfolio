# Triton Kernels

Three GPU kernels written in [Triton](https://triton-lang.org/), progressing from
fundamentals to a domain-specific fusion tied to medical image segmentation.

## Kernels

| Kernel | File | What it does |
|---|---|---|
| Vector Add | `kernels/vector_add.py` | Basic Triton programming model: grid, `program_id`, pointers, masking. |
| Fused Softmax | `kernels/fused_softmax.py` | Fuses max/subtract/exp/sum/divide into one kernel launch, avoiding native PyTorch's ~4 separate memory passes per row. |
| Fused Soft-Dice Loss | `kernels/soft_dice_loss.py` | Fuses the intersection/union reduction used in medical image segmentation (Dice loss) into a single kernel pass over a 2D grid, using atomic accumulation across spatial chunks. Motivated by segmentation work on datasets like ISLES (stroke) and DSA (vessel/artery). |

## Why the Dice kernel

Standard Triton tutorials stop at softmax. Medical segmentation losses like
Dice operate on much larger tensors (e.g. a single 512x512 slice is ~260K
elements, a 3D volume far more) that don't fit in one block's SRAM the way a
softmax row does. This kernel uses a 2D grid — one axis tiles across the
flattened spatial dimension in chunks, the other axis selects which
`(batch, channel)` segmentation slice is being processed — with
`tl.atomic_add` to safely accumulate partial sums from multiple blocks
into one output value per slice.

## Setup

```bash
pip install torch triton
```

Requires a CUDA-capable GPU.

## Run

Each kernel file is runnable standalone and self-checks correctness against
its native PyTorch equivalent:

```bash
python kernels/vector_add.py
python kernels/fused_softmax.py
python kernels/soft_dice_loss.py
```

Then run the full benchmark suite:

```bash
python benchmark.py
```

## Benchmark results

*(Run `benchmark.py` on your GPU and paste the output table here before
sharing this repo.)*

```
GPU: NVIDIA A100 80GB PCIe

[Vector Add] size=10000000
  Triton : 0.0805 ms  (1490.8 GB/s)
  PyTorch: 0.0799 ms  (1501.1 GB/s)

[Fused Softmax] shape=(4096, 2048)
  Triton : 0.0464 ms
  PyTorch: 0.0694 ms
  Speedup: 1.50x

[Fused Soft Dice Loss] shape=(8, 128, 512, 512) (B,C,H,W)
  Triton : 1.2161 ms
  PyTorch: 3.7591 ms
  Speedup: 3.09x
  
```

## Background

Written while learning Triton/CUDA fundamentals, applied to my ongoing
research in medical image segmentation (stroke lesion / intracranial
vessel segmentation) at IIT Bombay.
