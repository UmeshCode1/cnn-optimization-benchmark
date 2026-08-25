# Primary and Secondary Benchmark Metrics

## 1. Primary Metrics (Mandatory Units)
1. **Accuracy (%)**: Top-1 classification accuracy evaluated on the test set. Higher is better ($\uparrow$).
2. **Inference Latency (ms)**: Synchronized time per batch inference forward pass after 50 warm-up cycles. Lower is better ($\downarrow$).
3. **Model Size (MB)**: Serialized weight parameter artifact size on disk. Lower is better ($\downarrow$).
4. **Energy Consumption (J)**: Joules consumed during inference sampling. Lower is better ($\downarrow$).

## 2. Secondary Supporting Metrics
- **Parameters (M)**: Total countable weight tensor elements in Millions.
- **FLOPs (MFLOPs)**: Multiply-accumulate operations per single input tensor forward pass.
- **Compression Ratio**: Ratio of baseline model size to compressed model size ($\text{Size}_{base} / \text{Size}_{comp}$).
- **Speedup (x)**: Ratio of baseline inference latency to compressed latency ($\text{Lat}_{base} / \text{Lat}_{comp}$).
- **Accuracy Drop (%)**: Delta loss in accuracy relative to baseline ($\text{Acc}_{base} - \text{Acc}_{comp}$).
- **Candidate Evaluations**: Total objective function forward passes executed during metaheuristic search.
