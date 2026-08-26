export interface HardwareProfile {
  id?: number;
  device_name: string;
  device_type: string;
  cpu_model: string;
  cpu_cores: number;
  gpu_model: string;
  gpu_memory_mb: number;
  ram_gb: number;
  os_info: string;
  cuda_version: string;
  torch_version: string;
  python_version: string;
}

export interface BaselineSnapshot {
  accuracy: number;
  latency_ms: number;
  model_size_mb: number;
  energy_j: number;
  parameters_m: number;
  flops_m: number;
}

export interface Experiment {
  id: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  is_demo: boolean;
  preset: string;
  dataset_name: string;
  dataset_split: string;
  input_resolution: string;
  batch_size: number;
  cnn_model_name: string;
  checkpoint_name: string;
  quantization_type: string;
  pruning_method: string;
  pruning_ratio: number;
  selected_algorithms: string[];
  population_size: number;
  max_iterations: number;
  number_of_runs: number;
  random_seed_policy: string;
  base_seed: number;
  warmup_runs: number;
  measured_runs: number;
  weight_accuracy: number;
  weight_latency: number;
  weight_model_size: number;
  weight_energy: number;
  baseline: BaselineSnapshot;
  best_algorithm?: string;
  best_algorithm_reason?: string;
  pareto_optimal_algorithms: string[];
  error_message?: string;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
  hardware?: HardwareProfile;
}

export interface ExperimentRun {
  id: number;
  experiment_id: string;
  algorithm: string;
  run_index: number;
  seed: number;
  status: string;
  accuracy: number;
  accuracy_drop: number;
  latency_ms: number;
  latency_p95_ms: number;
  latency_min_ms: number;
  latency_max_ms: number;
  speedup: number;
  model_size_mb: number;
  compression_ratio: number;
  size_reduction_pct: number;
  energy_j: number;
  energy_source: string;
  energy_reduction_pct: number;
  parameters_m: number;
  flops_m: number;
  best_fitness: number;
  overall_score: number;
  optimization_time_seconds: number;
  candidate_evaluations: number;
  convergence_curve: number[];
  best_candidate_config?: Record<string, any>;
}

export interface StatisticalMetricSummary {
  mean: number;
  std: number;
  median: number;
  min_val: number;
  max_val: number;
  ci_95_lower: number;
  ci_95_upper: number;
}

export interface AlgorithmStats {
  algorithm: string;
  runs_count: number;
  accuracy: StatisticalMetricSummary;
  latency_ms: StatisticalMetricSummary;
  model_size_mb: StatisticalMetricSummary;
  energy_j: StatisticalMetricSummary;
  overall_score: StatisticalMetricSummary;
  raw_runs: ExperimentRun[];
}

export interface RankedAlgorithm {
  rank: number;
  algorithm: string;
  accuracy: number;
  accuracy_drop?: number;
  latency_ms: number;
  speedup?: number;
  model_size_mb: number;
  compression_ratio?: number;
  energy_j: number;
  parameters_m?: number;
  flops_m?: number;
  overall_score: number;
  is_pareto?: boolean;
  runs_count?: number;
}

export interface ParetoPoint {
  algorithm: string;
  accuracy: number;
  latency_ms: number;
  model_size_mb: number;
  energy_j: number;
  overall_score: number;
  is_pareto: boolean;
  run_index?: number;
}

export interface AblationRecord {
  stage_name: string;
  stage_order: number;
  accuracy: number;
  latency_ms: number;
  model_size_mb: number;
  energy_j: number;
  parameters_m: number;
  flops_m: number;
  description: string;
}

export interface AlgorithmMeta {
  key: string;
  name: string;
  acronym: string;
  year: number;
  authors: string;
  category: string;
  description: string;
  strengths: string[];
  status: string;
}

export interface DatasetInfo {
  id: string;
  name: string;
  is_custom: boolean;
  classes_count: number;
  classes: string[];
  train_samples: number;
  test_samples: number;
  resolution: string;
  channels: number;
  description: string;
  created_at: string;
  file_size_bytes?: number;
}
