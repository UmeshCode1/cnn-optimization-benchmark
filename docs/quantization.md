# Quantization Methodologies

The benchmark platform supports 4 standard quantization regimes:

1. **FP32 (Single Precision)**:
   - Full 32-bit floating point weights and activations.
   - Baseline reference without quantization loss.
2. **FP16 (Half Precision)**:
   - 16-bit IEEE 754 float utilizing GPU Tensor Cores.
   - $2.0\times$ model size reduction with virtually zero classification accuracy degradation.
3. **INT8 Post-Training Quantization (PTQ)**:
   - 8-bit signed integer representation with static calibration.
   - $4.0\times$ model size reduction and up to $2.8\times$ latency speedup on INT8 SIMD/TensorRT engines.
4. **INT8 Dynamic Quantization**:
   - Quantizes weights statically to 8-bit while dynamically quantizing activation tensors during forward inference passes.
