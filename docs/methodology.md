# Experimental Methodology & Fairness Principles

## 1. The Fair Comparison Rule
To ensure scientific validity, every benchmark strictly enforces that:
- **Same Dataset & Split**: All 10 optimizers evaluate on identical training, validation, and test splits (e.g. 50,000 train / 10,000 test on CIFAR-10).
- **Same Initial Checkpoint**: Every algorithm begins from the exact same pre-trained weights.
- **Same Hardware & Batch Size**: All inference passes occur on the identical compute device with fixed batch sizes and input resolutions.
- **Same Search Space**: Every optimizer explores identical layer-wise compression boundaries $[0.0, 1.0]$.
- **Same Stochastic Repetitions**: Repetitions are paired across algorithms using identical deterministic seeds.

## 2. Decision Making Modes
The platform provides 3 distinct modes to identify the best algorithm:
1. **Mode 1 — Individual Metric Champions**: Highlights the algorithm achieving highest Top-1 Accuracy, lowest Latency, smallest Model Size, and lowest Energy Consumption.
2. **Mode 2 — Weighted Overall Score**: Uses Min-Max normalization and user-customizable objective weights ($\sum w_i = 100\%$) to rank algorithms into an overall composite index.
3. **Mode 3 — Pareto Optimality**: Computes non-dominated solutions across multi-objective trade-offs.

## 3. Provenance Badges
Every reported metric displays an explicit audit badge:
- `● MEASURED`: Obtained from direct model inference or hardware power telemetry.
- `◆ CALCULATED`: Computed from analytical tensor dimensions or FLOPs formulas.
- `▲ ESTIMATED`: Derived from calibrated power models when hardware sensors are unavailable.
- `DEMO DATA`: Clearly labeled when running in simulated UI test mode.
