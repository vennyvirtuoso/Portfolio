# Custom Triton GPU Kernels & Fusion Benchmarks

High-performance GPU kernels written in [OpenAI Triton](https://triton-lang.org/), progressing from baseline grid operations to a custom 2D-grid fused loss kernel designed for 3D tensor segmentation.

Live Interactive Showcase: [vennyvirtuoso.github.io/triton-kernels](https://vennyvirtuoso.github.io/triton-kernels/)

---

## ⚡ Key Highlights & Benchmark Summary

Benchmarked on an **NVIDIA A100 80GB PCIe GPU** (CUDA 12.4, PyTorch 2.4):

| Kernel | File | PyTorch Eager | Triton Fused | Speedup / Throughput | Key Optimization |
|---|---|---|---|---|---|
| **Fused Soft-Dice Loss** | [`kernels/soft_dice_loss.py`](kernels/soft_dice_loss.py) | `3.7591 ms` | **`1.2161 ms`** | **3.09x faster** | 2D Block Grid + SRAM Register Fusion + `tl.atomic_add` |
| **Fused Softmax** | [`kernels/fused_softmax.py`](kernels/fused_softmax.py) | `0.0694 ms` | **`0.0464 ms`** | **1.50x faster** | Single-pass row reduction entirely in registers |
| **Vector Addition** | [`kernels/vector_add.py`](kernels/vector_add.py) | `0.0799 ms` | **`0.0805 ms`** | ~1501 GB/s | DRAM Bandwidth Saturation Baseline |

---

## 🧠 Technical Deep-Dive: Fused Soft-Dice Loss

Standard Triton tutorials stop at single-row Softmax where an entire row fits inside one block's SRAM. Large 3D segmentation masks (e.g. `512 x 512` slice = ~262K elements per channel) cannot fit into a single block's register file.

Standard PyTorch eager execution dispatches **4 sequential ATen kernels** for Dice Loss (elementwise product + 3 separate `.sum()` reductions), forcing 4 roundtrips to global HBM memory.

### Optimization Strategy:
1. **2D Grid Partitioning**: `Axis 0` tiles spatial elements across cooperating blocks; `Axis 1` indexes individual batch-channel slices.
2. **In-Register Reduction**: Reads `pred` and `target` pointers exactly once from global DRAM, accumulating partial sums directly in fast L1/SRAM registers.
3. **Lock-Free Atomic Accumulation**: Uses `tl.atomic_add` to aggregate partial sums across Axis 0 spatial threadblocks into output scalars without data races.

This cuts global memory traffic by ~75% and yields a **3.09x empirical speedup**.

---

## 🚀 Quickstart & Verification

### Installation
```bash
pip install torch triton
```

### Running Individual Kernels
Each kernel contains standalone correctness validation against native PyTorch (`torch.allclose` with `atol < 1e-4`):

```bash
python kernels/vector_add.py
python kernels/fused_softmax.py
python kernels/soft_dice_loss.py
```

### Run Benchmark Profiler Suite
To run micro-benchmarks via `triton.testing.do_bench`:

```bash
python benchmark.py
```

---

## 📊 Benchmark Output Log

```text
GPU: NVIDIA A100 80GB PCIe

[Vector Add] size=10,000,000
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

---

## 📄 License & Contact

Created by **Vijendra Kumar** | [LinkedIn Profile](https://www.linkedin.com/in/vennyvirtuoso/)  
Repository: [github.com/vennyvirtuoso/triton-kernels](https://github.com/vennyvirtuoso/triton-kernels)
