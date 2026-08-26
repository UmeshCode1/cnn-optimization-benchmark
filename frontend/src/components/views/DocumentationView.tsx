import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  Layers,
  Cpu,
  Database,
  GitFork,
  Activity,
  Award,
  ShieldCheck,
  Code2,
  Sparkles,
  Info,
} from 'lucide-react';
import { AlgorithmMeta } from '../../types';
import { api } from '../../services/api';
import { AlgorithmUploadModal } from '../common/AlgorithmUploadModal';

export const DocumentationView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'algorithms' | 'architecture' | 'metrics' | 'decisions' | 'author'>('algorithms');
  const [algorithms, setAlgorithms] = useState<AlgorithmMeta[]>([]);
  const [selectedAlg, setSelectedAlg] = useState<AlgorithmMeta | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAlgorithms = async () => {
    try {
      const algs = await api.getAlgorithms();
      setAlgorithms(algs);
      if (algs.length > 0 && !selectedAlg) {
        setSelectedAlg(algs[0]);
      }
    } catch (err) {
      console.error('Failed to load algorithms:', err);
    }
  };

  useEffect(() => {
    fetchAlgorithms();
  }, []);

  const handleDelete = async (key: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete custom algorithm "${name}" (${key})?`)) {
      return;
    }
    try {
      await api.deleteAlgorithm(key);
      setAlgorithms((prev) => prev.filter((a) => a.key !== key));
      if (selectedAlg?.key === key) {
        setSelectedAlg(algorithms[0] || null);
      }
    } catch (err: any) {
      alert(`Failed to delete algorithm: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="ws-page-title">Platform Documentation &amp; Research Manual</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--accent)] border border-[var(--border)] font-semibold">
              v2.4 Scientific
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Deep technical manual, mathematical formulations, hardware execution protocols, and architectural specifications.
          </p>
        </div>

        {activeTab === 'algorithms' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 ws-button-primary text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Custom Algorithm</span>
          </button>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 overflow-x-auto text-xs font-mono">
        {[
          { id: 'algorithms', label: '1. Optimizers & Mathematical Contracts', icon: Code2 },
          { id: 'architecture', label: '2. System Pipeline & Storage Architecture', icon: Layers },
          { id: 'metrics', label: '3. Evaluation & Metrics Formulation', icon: Activity },
          { id: 'decisions', label: '4. Pareto & Decision Modes', icon: GitFork },
          { id: 'author', label: '5. Platform Overview & Author Profile', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[var(--surface-elevated)] text-[var(--accent)] font-semibold border border-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Algorithms */}
      {activeTab === 'algorithms' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: List of Algorithms */}
          <div className="space-y-1.5">
            {algorithms.map((alg) => {
              const isSelected = selectedAlg?.key === alg.key;
              return (
                <div
                  key={alg.key}
                  onClick={() => setSelectedAlg(alg)}
                  className={`p-3 rounded-md border cursor-pointer transition-colors select-none flex items-center justify-between ${
                    isSelected
                      ? 'bg-[var(--surface-elevated)] border-[var(--accent)]'
                      : 'ws-panel text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-xs font-mono text-[var(--text-primary)]">
                      {alg.key} &bull; {alg.name}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      {alg.category} &bull; {alg.year}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-medium px-1.5 py-0.2 rounded ${
                      alg.is_custom
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                        : 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/30'
                    }`}
                  >
                    {alg.is_custom ? 'CUSTOM' : 'VERIFIED'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right: Selected Algorithm Deep-Dive Details */}
          {selectedAlg && (
            <div className="ws-panel p-6 lg:col-span-2 space-y-5 text-xs">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div>
                  <span className="text-[10px] font-mono text-[var(--accent)] font-semibold uppercase">
                    {selectedAlg.category}
                  </span>
                  <h3 className="text-base font-bold text-[var(--text-primary)] mt-0.5">
                    {selectedAlg.name} ({selectedAlg.key})
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded font-medium ${
                      selectedAlg.is_custom
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                        : 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/30'
                    }`}
                  >
                    {selectedAlg.is_custom ? 'CUSTOM USER OPTIMIZER' : 'MATHEMATICALLY VERIFIED'}
                  </span>

                  {selectedAlg.is_custom && (
                    <button
                      onClick={() => handleDelete(selectedAlg.key, selectedAlg.name)}
                      className="p-1 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded transition-colors"
                      title="Delete Custom Algorithm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[11px] font-mono text-[var(--text-muted)] block mb-1">Primary Literature Reference:</span>
                  <div className="p-2.5 rounded bg-[var(--surface-secondary)] border border-[var(--border)] font-mono text-[11px] text-[var(--text-secondary)]">
                    {selectedAlg.authors} ({selectedAlg.year}). <em>{selectedAlg.name}</em>.
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-mono text-[var(--text-muted)] block mb-1">Search Mechanism &amp; Exploration/Exploitation:</span>
                  <p className="text-[var(--text-secondary)] leading-relaxed">{selectedAlg.description}</p>
                </div>

                <div>
                  <span className="text-[11px] font-mono text-[var(--text-muted)] block mb-1">Key Algorithmic Strengths:</span>
                  <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
                    {selectedAlg.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-md space-y-1.5 font-mono text-[11px]">
                  <span className="font-semibold text-[var(--text-primary)]">Standard Optimization Contract:</span>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    Adheres to <code>BaseOptimizer.optimize()</code> with continuous bounds $[0.0, 1.0]^D$, multi-objective cost evaluation, population size $N$, max iterations $T$, and deterministic seed initialization.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: System Pipeline & Storage Architecture */}
      {activeTab === 'architecture' && (
        <div className="space-y-5 text-xs leading-relaxed">
          <div className="ws-panel p-6 space-y-4">
            <h3 className="ws-section-title">7-Stage Deterministic Benchmark Pipeline</h3>
            <p className="text-[var(--text-secondary)]">
              The benchmarking platform executes an asynchronous multi-stage evaluation pipeline to ensure mathematically rigorous and reproducible comparisons:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 rounded bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1">
                <span className="font-semibold text-[var(--accent)]">1. Baseline Calibration:</span>
                <p className="text-[var(--text-muted)]">Evaluates uncompressed FP32 dense CNN model on selected vision test split.</p>
              </div>
              <div className="p-3 rounded bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1">
                <span className="font-semibold text-[var(--accent)]">2. Quantization Stage:</span>
                <p className="text-[var(--text-muted)]">Applies FP16 or INT8 Post-Training Quantization (PTQ) calibration.</p>
              </div>
              <div className="p-3 rounded bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1">
                <span className="font-semibold text-[var(--accent)]">3. Structured Pruning:</span>
                <p className="text-[var(--text-muted)]">Performs L1-norm channel/filter pruning to reduce MAC operations.</p>
              </div>
              <div className="p-3 rounded bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1">
                <span className="font-semibold text-[var(--accent)]">4. Metaheuristic Search:</span>
                <p className="text-[var(--text-muted)]">Executes population-based optimizer over layer-wise compression vectors.</p>
              </div>
              <div className="p-3 rounded bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1">
                <span className="font-semibold text-[var(--accent)]">5. Hardware Telemetry:</span>
                <p className="text-[var(--text-muted)]">Runs warm-up + synchronized forward passes measuring latency and energy.</p>
              </div>
              <div className="p-3 rounded bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1">
                <span className="font-semibold text-[var(--accent)]">6. Statistical Aggregation:</span>
                <p className="text-[var(--text-muted)]">Computes Mean, Median, Variance, and 95% Confidence Intervals across N runs.</p>
              </div>
              <div className="p-3 rounded bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1 col-span-1 md:col-span-2">
                <span className="font-semibold text-[var(--accent)]">7. Pareto Frontier &amp; Multi-Objective Scoring:</span>
                <p className="text-[var(--text-muted)]">Extracts non-dominated solutions and computes WSM composite score (0-100 scale).</p>
              </div>
            </div>
          </div>

          <div className="ws-panel p-6 space-y-3">
            <h3 className="ws-section-title">Persistent Database Storage Architecture</h3>
            <p className="text-[var(--text-secondary)]">
              All experiments, runs, uploaded datasets, custom models, and iteration logs are permanently persisted in the local SQLite database (<code className="font-mono">benchmark.db</code>) managed via SQLAlchemy ORM.
            </p>
            <div className="p-3 rounded bg-[var(--surface-secondary)] border border-[var(--border)] font-mono text-[11px] text-[var(--text-muted)] space-y-1">
              <div>&bull; <strong>Experiments</strong>: Title, Dataset, Model, Quantization, Pruning, Seed, Weights, Status.</div>
              <div>&bull; <strong>ExperimentRuns</strong>: Stochastic repetition metrics (Accuracy, Latency, Size, Energy, Pareto).</div>
              <div>&bull; <strong>MetricRecords</strong>: High-resolution hardware telemetry with provenance auditing.</div>
              <div>&bull; <strong>AblationRecords</strong>: 5-stage sequential decomposition records.</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Evaluation & Metrics Formulation */}
      {activeTab === 'metrics' && (
        <div className="ws-panel p-6 space-y-5 text-xs leading-relaxed">
          <h3 className="ws-section-title">Evaluation Metrics &amp; Mathematical Derivations</h3>

          <div className="space-y-4 font-mono text-xs">
            <div className="p-4 rounded bg-[var(--surface-secondary)] border border-[var(--border)] space-y-2">
              <span className="font-bold text-[var(--success)] block">1. Top-1 Classification Accuracy (%)</span>
              <p className="text-[var(--text-secondary)] font-sans">
                Evaluated on the standardized vision validation/test dataset split:
              </p>
              <div className="p-2 rounded bg-[var(--surface)] text-[var(--text-primary)] font-mono">
                Accuracy (%) = (Correctly Classified Samples / Total Test Samples) * 100
              </div>
            </div>

            <div className="p-4 rounded bg-[var(--surface-secondary)] border border-[var(--border)] space-y-2">
              <span className="font-bold text-[var(--accent)] block">2. Synchronized Inference Latency (ms)</span>
              <p className="text-[var(--text-secondary)] font-sans">
                Measured with 50 unmeasured warm-up iterations followed by 200 timed forward passes. Synchronized on GPU via <code className="font-mono">torch.cuda.synchronize()</code> to prevent asynchronous queue timing bias.
              </p>
            </div>

            <div className="p-4 rounded bg-[var(--surface-secondary)] border border-[var(--border)] space-y-2">
              <span className="font-bold text-[var(--warning)] block">3. Serialized Model Size (MB)</span>
              <p className="text-[var(--text-secondary)] font-sans">
                Direct disk artifact byte footprint of compressed state dictionary:
              </p>
              <div className="p-2 rounded bg-[var(--surface)] text-[var(--text-primary)] font-mono">
                Size (MB) = State_Dict_Bytes / (1024 * 1024)
              </div>
            </div>

            <div className="p-4 rounded bg-[var(--surface-secondary)] border border-[var(--border)] space-y-2">
              <span className="font-bold text-purple-400 block">4. Energy Consumption (Joules)</span>
              <p className="text-[var(--text-secondary)] font-sans">
                Measured via NVIDIA NVML power sampling (<code className="font-mono">pynvml</code>) on GPU, or calibrated FLOP-TDP power models on CPU:
              </p>
              <div className="p-2 rounded bg-[var(--surface)] text-[var(--text-primary)] font-mono">
                Energy (J) = Average_Power (Watts) * Duration (Seconds)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Pareto & Decision Modes */}
      {activeTab === 'decisions' && (
        <div className="ws-panel p-6 space-y-5 text-xs leading-relaxed">
          <h3 className="ws-section-title">Decision Modes &amp; Pareto Dominance</h3>

          <div className="space-y-3 font-sans">
            <div className="p-3.5 rounded bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1.5">
              <span className="font-semibold text-[var(--text-primary)] font-mono">Mode 1: Metric Champions</span>
              <p className="text-[var(--text-secondary)]">
                Identifies individual objective leaders: Highest Top-1 Accuracy, Lowest Latency (ms), Smallest Footprint (MB), and Lowest Energy (J).
              </p>
            </div>

            <div className="p-3.5 rounded bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1.5">
              <span className="font-semibold text-[var(--text-primary)] font-mono">Mode 2: Weighted Sum Model (WSM) Scoring</span>
              <p className="text-[var(--text-secondary)]">
                Normalizes all 4 objectives to $[0, 1]$ (inverting latency, size, and energy for minimization) and computes composite score:
              </p>
              <div className="p-2 rounded bg-[var(--surface)] font-mono text-[var(--accent)] text-center font-bold">
                Score = (w_acc &bull; NormAcc + w_lat &bull; NormLat + w_size &bull; NormSize + w_energy &bull; NormEnergy) &times; 100
              </div>
            </div>

            <div className="p-3.5 rounded bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1.5">
              <span className="font-semibold text-[var(--text-primary)] font-mono">Mode 3: Pareto Frontier Extraction</span>
              <p className="text-[var(--text-secondary)]">
                Identifies all non-dominated candidate models. A solution A dominates B if A is superior in at least one objective and no worse in any objective.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Author & Platform Overview */}
      {activeTab === 'author' && (
        <div className="space-y-5 text-xs leading-relaxed">
          <div className="ws-panel p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center font-bold text-[var(--accent)] font-mono text-sm">
                UC
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">CNN Optimization Benchmark Platform</h3>
                <span className="text-xs text-[var(--text-muted)] font-mono">
                  Created &amp; Maintained by <strong>Umesh</strong> (@UmeshCode1)
                </span>
              </div>
            </div>

            <p className="text-[var(--text-secondary)]">
              This platform was built as a dedicated scientific research workstation to eliminate subjective bias when evaluating metaheuristic algorithms for deep neural network compression. By holding architectures, datasets, quantization settings, and pruning protocols constant, researchers can objectively measure true algorithmic superiority.
            </p>

            <div className="pt-3 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              <div>
                <span className="text-[var(--text-muted)] block text-[11px]">GitHub Repository:</span>
                <a
                  href="https://github.com/UmeshCode1/cnn-optimization-benchmark"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--accent)] hover:underline font-semibold"
                >
                  UmeshCode1/cnn-optimization-benchmark &rarr;
                </a>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[11px]">License:</span>
                <span className="font-semibold text-[var(--text-primary)]">MIT Open Source License</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Algorithm Upload Modal */}
      <AlgorithmUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAlgorithmAdded={(newAlgo) => {
          setAlgorithms((prev) => [...prev, newAlgo]);
          setSelectedAlg(newAlgo);
        }}
      />
    </div>
  );
};
