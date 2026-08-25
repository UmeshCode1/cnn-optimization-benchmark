# Pruning Methodologies & Sparsity Constraints

The benchmark distinguishes between structured and unstructured pruning:

### 1. Structured Channel Pruning (Recommended for Real Hardware Speedup)
- Computes the $L_1$-norm of convolution filter channels: $\|W_{c}\|_1 = \sum |w_{c,i,j}|$.
- Prunes lowest-magnitude entire channel slices.
- **Hardware Impact**: Yields smaller dense matrix dimensions, leading directly to reduced FLOPs, memory footprint, and measurable latency reduction on standard CPU/GPU execution backends.

### 2. Structured Filter Pruning
- Prunes entire 2D convolution filters to reduce output feature map depth.

### 3. Unstructured Magnitude Pruning
- Sets individual lowest-magnitude weights to zero.
- **Hardware Impact**: High theoretical sparsity without direct dense GEMM kernel acceleration on standard accelerators unless specialized sparse matrix engines (e.g. NVIDIA 2:4 structured sparse Tensor Cores) are used.
