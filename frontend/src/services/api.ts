import {
  Experiment,
  RankedAlgorithm,
  AlgorithmStats,
  ParetoPoint,
  AblationRecord,
  AlgorithmMeta,
  HardwareProfile,
  SystemCapabilities,
  DatasetInfo,
  CNNModelInfo,
  ConfusionMatrixResponse,
} from '../types';

const API_BASE = '/api';

export const api = {
  // System Capabilities & Mode
  async getCapabilities(): Promise<SystemCapabilities> {
    const res = await fetch(`${API_BASE}/experiments/capabilities`);
    if (!res.ok) {
      // Fallback if capabilities endpoint fails
      return {
        default_mode: 'DEMO',
        demo_mode_available: true,
        real_mode_available: false,
        real_mode_reason: 'Could not connect to backend capabilities check',
        capabilities: {} as any,
        deployment_note: 'Render Free Tier — Demo / Simulation Mode Active',
      };
    }
    return res.json();
  },

  async cancelExperiment(expId: string): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/experiments/${expId}/cancel`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to cancel experiment ${expId}`);
    return res.json();
  },

  // Experiments
  async listExperiments(dataset?: string, model?: string, status?: string): Promise<Experiment[]> {
    const params = new URLSearchParams();
    if (dataset) params.append('dataset', dataset);
    if (model) params.append('model', model);
    if (status) params.append('status', status);
    const res = await fetch(`${API_BASE}/experiments?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch experiments');
    return res.json();
  },

  async getExperiment(expId: string): Promise<{
    experiment: Experiment;
    runs: any[];
    statistics_by_algorithm: Record<string, AlgorithmStats>;
    ranked_algorithms: RankedAlgorithm[];
    pareto_points: ParetoPoint[];
    ablations: AblationRecord[];
  }> {
    const res = await fetch(`${API_BASE}/experiments/${expId}`);
    if (!res.ok) throw new Error(`Failed to fetch experiment details: ${expId}`);
    return res.json();
  },

  async getExperimentDetails(expId: string) {
    return this.getExperiment(expId);
  },

  async validateFairness(config: any): Promise<{
    is_valid: boolean;
    status: string;
    message: string;
    guarantees: { property: string; value: string; status: string; description: string }[];
    warnings: string[];
  }> {
    const res = await fetch(`${API_BASE}/experiments/validate-fairness`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error('Fairness validation request failed');
    return res.json();
  },

  async createExperiment(config: any, autoRun: boolean = true): Promise<Experiment> {
    const res = await fetch(`${API_BASE}/experiments?auto_run=${autoRun}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create experiment');
    }
    return res.json();
  },

  async runExperiment(expId: string): Promise<{ status: string; experiment_id: string }> {
    const res = await fetch(`${API_BASE}/experiments/${expId}/run`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to start benchmark');
    return res.json();
  },

  async cloneExperiment(expId: string): Promise<Experiment> {
    const res = await fetch(`${API_BASE}/experiments/${expId}/clone`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to clone experiment');
    return res.json();
  },

  async recalculateWeights(
    expId: string,
    weights: { weight_accuracy: number; weight_latency: number; weight_model_size: number; weight_energy: number },
    statMode: string = 'MEAN'
  ): Promise<{ ranked_algorithms: RankedAlgorithm[]; winner_info: any }> {
    const res = await fetch(`${API_BASE}/experiments/${expId}/recalculate-weights?stat_mode=${statMode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(weights),
    });
    if (!res.ok) throw new Error('Failed to recalculate objective weights');
    return res.json();
  },

  async recalculateScores(
    expId: string,
    weights: { weight_accuracy?: number; weight_latency?: number; weight_model_size?: number; weight_energy?: number; accuracy?: number; latency?: number; model_size?: number; energy?: number },
    statMode: string = 'MEAN'
  ): Promise<{
    experiment: Experiment;
    runs: any[];
    statistics_by_algorithm: Record<string, AlgorithmStats>;
    ranked_algorithms: RankedAlgorithm[];
    pareto_points: ParetoPoint[];
    ablations: AblationRecord[];
  }> {
    const formattedWeights = {
      weight_accuracy: weights.weight_accuracy ?? weights.accuracy ?? 0.4,
      weight_latency: weights.weight_latency ?? weights.latency ?? 0.25,
      weight_model_size: weights.weight_model_size ?? weights.model_size ?? 0.2,
      weight_energy: weights.weight_energy ?? weights.energy ?? 0.15,
    };
    await this.recalculateWeights(expId, formattedWeights, statMode);
    return this.getExperiment(expId);
  },

  async compareSelected(
    expId: string,
    algorithmAcronyms: string[],
    statMode: string = 'MEAN'
  ): Promise<{
    ranked_algorithms: RankedAlgorithm[];
    statistics_by_algorithm: Record<string, AlgorithmStats>;
    pareto_points: ParetoPoint[];
    runs: any[];
  }> {
    const res = await fetch(`${API_BASE}/experiments/${expId}/compare-selected`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ algorithm_acronyms: algorithmAcronyms, stat_mode: statMode }),
    });
    if (!res.ok) throw new Error('Failed to compare selected algorithms');
    return res.json();
  },

  // Algorithms
  async getAlgorithms(): Promise<AlgorithmMeta[]> {
    const res = await fetch(`${API_BASE}/algorithms`);
    if (!res.ok) throw new Error('Failed to fetch algorithm catalog');
    return res.json();
  },

  async registerAlgorithm(payload: {
    key: string;
    name: string;
    category?: string;
    description?: string;
    authors?: string;
    year?: number;
    strengths?: string[];
    exploration_rate?: number;
    python_code?: string;
  }): Promise<AlgorithmMeta> {
    const res = await fetch(`${API_BASE}/algorithms/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to register algorithm' }));
      throw new Error(err.detail || 'Failed to register algorithm');
    }
    return res.json();
  },

  async uploadAlgorithmFile(formData: FormData): Promise<AlgorithmMeta> {
    const res = await fetch(`${API_BASE}/algorithms/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to upload algorithm file' }));
      throw new Error(err.detail || 'Failed to upload algorithm file');
    }
    return res.json();
  },

  async deleteAlgorithm(key: string): Promise<void> {
    const res = await fetch(`${API_BASE}/algorithms/${key}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete algorithm ${key}`);
  },

  // Models
  async listModels(): Promise<CNNModelInfo[]> {
    const res = await fetch(`${API_BASE}/models`);
    if (!res.ok) throw new Error('Failed to fetch CNN models');
    return res.json();
  },

  async registerModel(payload: {
    name: string;
    parameters_m: number;
    flops_m: number;
    base_accuracy: number;
    description?: string;
  }): Promise<CNNModelInfo> {
    const res = await fetch(`${API_BASE}/models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to register model' }));
      throw new Error(err.detail || 'Failed to register model');
    }
    return res.json();
  },

  async deleteModel(modelId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/models/${modelId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete model ${modelId}`);
  },

  // Hardware
  async getHardwareProfile(): Promise<HardwareProfile> {
    const res = await fetch(`${API_BASE}/hardware`);
    if (!res.ok) throw new Error('Failed to fetch hardware telemetry');
    return res.json();
  },

  // Ablation
  async getAblationStudy(expId: string): Promise<{ experiment_id: string; stages: AblationRecord[] }> {
    const res = await fetch(`${API_BASE}/ablation/${expId}`);
    if (!res.ok) throw new Error('Failed to fetch ablation study');
    return res.json();
  },

  // Confusion Matrix
  async getConfusionMatrix(
    expId: string,
    params?: {
      algorithm?: string;
      compare_algorithm?: string;
      run_index?: number;
      normalized?: boolean;
      comparison?: 'BASELINE' | 'ALGORITHM' | 'NONE';
    }
  ): Promise<ConfusionMatrixResponse> {
    const query = new URLSearchParams();
    if (params?.algorithm) query.append('algorithm', params.algorithm);
    if (params?.compare_algorithm) query.append('compare_algorithm', params.compare_algorithm);
    if (params?.run_index !== undefined) query.append('run_index', String(params.run_index));
    if (params?.normalized !== undefined) query.append('normalized', String(params.normalized));
    if (params?.comparison) query.append('comparison', params.comparison);

    const res = await fetch(`${API_BASE}/experiments/${expId}/confusion-matrix?${query.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch confusion matrix' }));
      throw new Error(err.detail || 'Failed to fetch confusion matrix');
    }
    return res.json();
  },

  // Reports
  getExportUrl(expId: string, format: 'csv' | 'markdown' | 'json'): string {
    return `${API_BASE}/reports/${expId}/${format}`;
  },

  // Datasets
  async listDatasets(): Promise<DatasetInfo[]> {
    const res = await fetch(`${API_BASE}/datasets`);
    if (!res.ok) throw new Error('Failed to fetch datasets');
    return res.json();
  },

  async uploadDataset(formData: FormData): Promise<DatasetInfo> {
    const res = await fetch(`${API_BASE}/datasets/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to upload dataset' }));
      throw new Error(err.detail || 'Failed to upload dataset');
    }
    return res.json();
  },

  async deleteDataset(datasetId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/datasets/${datasetId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete dataset');
  },

  // Installer & Local Daemon Probing
  async getInstallerPreflight(): Promise<InstallerPreflightInfo> {
    const res = await fetch(`${API_BASE}/installer/preflight`);
    if (!res.ok) throw new Error('Failed to fetch installer preflight specs');
    return res.json();
  },

  async probeLocalDaemon(port = 8000): Promise<{ isRunning: boolean; data?: any }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`http://localhost:${port}/api/health`, {
        signal: controller.signal,
        mode: 'cors',
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        return { isRunning: true, data };
      }
    } catch {
      // Local daemon offline or not yet started
    }
    return { isRunning: false };
  },

  // WebSocket
  createProgressWebSocket(expId: string, onMessage: (data: any) => void): WebSocket {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/experiment/${expId}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    return ws;
  },
};
