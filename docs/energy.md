# Energy Measurement & Power Telemetry

## 1. Physical Units
Energy is strictly recorded and displayed in **Joules (J)**.

$$\text{Energy (Joules)} = \text{Average Power (Watts)} \times \text{Duration (Seconds)}$$

## 2. Telemetry Sources & Provenance
1. **`MEASURED_GPU_NVML`**: Real-time milliwatt power telemetry sampled from NVIDIA NVML (`pynvml`) during synchronized inference execution.
2. **`MEASURED_CPU_RAPL`**: Running Average Power Limit (RAPL) hardware performance counter telemetry on Intel/AMD CPUs.
3. **`ESTIMATED_FLOP_POWER_MODEL`**: Calibrated hardware model combining measured duration, baseline TDP, and operational FLOP intensity ($1.2 \times 10^{-6}\text{ J per MFLOP}$).

Whenever estimated energy is used, the system explicitly badges the metric as `▲ ESTIMATED` and notes the model in the report.
