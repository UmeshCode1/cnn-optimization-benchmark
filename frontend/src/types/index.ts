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

export interface CapabilityMatrix {
  python_version: string;
  pytorch_available: boolean;
  pytorch_version?: string;
  cpu_model: string;
  cpu_cores: number;
  ram_gb: number;
  os_info: string;
  cuda_available: boolean;
  cuda_version?: string;
  gpu_model?: string;
  gpu_vram_mb: number;
  gpu_count: number;
  nvml_available: boolean;
  rapl_available: boolean;
  cpu_inference_available: boolean;
  gpu_inference_available: boolean;
  int8_dynamic_available: boolean;
  int8_static_available: boolean;
  fp16_available: boolean;
  datasets_available: string[];
  real_mode_feasible: boolean;
  real_mode_reason: string;
  detection_warnings: string[];
}

export interface SystemCapabilities {
  default_mode: 'DEMO' | 'REAL';
  demo_mode_available: boolean;
  real_mode_available: boolean;
  real_mode_reason: string;
  capabilities: CapabilityMatrix;
  deployment_note: string;
}

export interface BaselineSnapshot {
  accuracy: number;
  accuracy_provenance?: string;
  latency_ms: number;
  latency_provenance?: string;
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
  execution_mode?: 'DEMO' | 'REAL';
  execution_environment?: string;
  measurement_capabilities?: Record<string, any>;
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
  execution_mode?: 'DEMO' | 'REAL';
  accuracy_provenance?: string;
  latency_provenance?: string;
  energy_provenance?: string;
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
  accuracy_provenance?: string;
  latency_ms: number;
  latency_provenance?: string;
  speedup?: number;
  model_size_mb: number;
  compression_ratio?: number;
  energy_j: number;
  energy_provenance?: string;
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
  is_custom?: boolean;
  exploration_rate?: number;
}

export interface CNNModelInfo {
  id: string;
  name: string;
  parameters_m: number;
  flops_m: number;
  base_accuracy: number;
  is_custom: boolean;
  description: string;
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

export interface ConfusionProvenance {
  mode: 'REAL' | 'SIMULATION';
  provenance: 'ACTUAL_PREDICTIONS' | 'SIMULATED_MODEL';
  synthetic: boolean;
  prediction_source: string;
  dataset_name: string;
  cnn_model_name: string;
  algorithm_name: string;
  run_index: number;
  sample_count: number;
  classes_count: number;
  calibration?: string;
  notes: string;
  [key: string]: any;
}

export interface PerClassMetric {
  class_index: number;
  class_name: string;
  semantic_group?: string;
  support: number;
  true_positives: number;
  false_positives: number;
  false_negatives: number;
  true_negatives: number;
  tp: number;
  tn: number;
  fp: number;
  fn: number;
  precision: number;
  recall: number;
  sensitivity?: number;
  specificity: number;
  fpr?: number;
  fnr?: number;
  npv?: number;
  balanced_accuracy?: number;
  mcc?: number;
  f1_score: number;
  baseline_recall?: number | null;
  recall_drop_pp?: number | null;
  baseline_precision?: number | null;
  precision_drop_pp?: number | null;
}

export interface ConfusedPair {
  true_class_index: number;
  true_class: string;
  pred_class_index: number;
  predicted_class: string;
  count: number;
  percentage_of_true_class: number;
}

export interface SymmetricConfusedPair {
  class_a: string;
  class_b: string;
  class_a_index: number;
  class_b_index: number;
  a_to_b_count: number;
  b_to_a_count: number;
  total_mutual_confusion: number;
}

export interface SemanticGroupSummary {
  group_name: string;
  classes_count: number;
  total_support: number;
  mean_recall: number;
  mean_f1: number;
  mean_recall_drop_pp?: number | null;
}

export interface ConfusionGlobalMetrics {
  accuracy: number;
  macro_precision: number;
  macro_recall: number;
  macro_specificity?: number;
  balanced_accuracy?: number;
  macro_mcc?: number;
  macro_f1: number;
  weighted_f1: number;
  total_samples: number;
  total_correct: number;
  total_true_positives?: number;
  total_false_positives?: number;
  total_false_negatives?: number;
  total_true_negatives?: number;
}

export interface ConfusionMatrixEvaluation {
  dataset: string;
  classes: string[];
  classes_count: number;
  algorithm: string;
  provenance: ConfusionProvenance;
  raw_matrix: number[][];
  normalized_matrix: number[][];
  baseline_raw_matrix?: number[][] | null;
  baseline_normalized_matrix?: number[][] | null;
  delta_normalized_matrix?: number[][] | null;
  delta_raw_matrix?: number[][] | null;
  global_metrics: ConfusionGlobalMetrics;
  per_class_metrics: PerClassMetric[];
  top_confused_pairs: ConfusedPair[];
  top_symmetric_pairs: SymmetricConfusedPair[];
  degraded_classes: PerClassMetric[];
  semantic_summary: SemanticGroupSummary[];
}

export interface AlgorithmComparisonDifferential {
  comparison_type: string;
  algorithm_a: string;
  algorithm_b: string;
  delta_normalized_matrix: number[][];
  delta_raw_matrix: number[][];
  accuracy_diff: number;
  macro_f1_diff: number;
}

export interface ConfusionMatrixResponse {
  experiment_id: string;
  experiment_title: string;
  dataset_name: string;
  cnn_model_name: string;
  selected_algorithm: string;
  selected_run_index: number;
  available_algorithms: string[];
  algorithm_runs_map: Record<string, number[]>;
  evaluation: ConfusionMatrixEvaluation;
  algorithm_comparison?: AlgorithmComparisonDifferential | null;
  comparison_mode: 'BASELINE' | 'ALGORITHM' | 'NONE';
  baseline_accuracy: number;
  model_accuracy: number;
  accuracy_drop: number;
}

export interface InstallerPreflightInfo {
  server_status: string;
  current_server_mode: 'DEMO' | 'REAL';
  system_requirements: {
    os: string[];
    ram_minimum_gb: number;
    ram_recommended_gb: number;
    python_minimum: string;
    python_recommended: string;
    gpu_support: string;
    disk_space_gb: number;
  };
  commands: {
    windows_powershell: string;
    mac_linux_bash: string;
    docker_compose: string;
    python_manual: string;
  };
  download_urls: {
    windows_bat: string;
    windows_ps1: string;
    unix_sh: string;
  };
}

