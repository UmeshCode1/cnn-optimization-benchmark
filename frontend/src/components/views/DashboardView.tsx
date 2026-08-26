import React from 'react';
import {
  PlayCircle,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Experiment, RankedAlgorithm, ParetoPoint } from '../../types';
import { MetricCard } from '../common/MetricCard';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { AlgorithmComparisonWorkbench } from '../common/AlgorithmComparisonWorkbench';

interface DashboardViewProps {
  experiments: Experiment[];
  latestExperiment?: Experiment;
  rankedAlgorithms: RankedAlgorithm[];
  paretoPoints?: ParetoPoint[];
  onNewBenchmark: () => void;
  onOpenExperiment: (expId: string) => void;
  onViewResults: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  experiments,
  latestExperiment,
  rankedAlgorithms,
  paretoPoints = [],
  onNewBenchmark,
  onOpenExperiment,
  onViewResults,
}) => {
  const completedCount = experiments.filter((e) => e.status === 'COMPLETED').length;
  const runningCount = experiments.filter((e) => e.status === 'RUNNING' || e.status === 'QUEUED').length;
  const failedCount = experiments.filter((e) => e.status === 'FAILED').length;

  const bestAccAlg = rankedAlgorithms.length > 0
    ? [...rankedAlgorithms].sort((a, b) => b.accuracy - a.accuracy)[0]
    : null;

  const bestLatAlg = rankedAlgorithms.length > 0
    ? [...rankedAlgorithms].sort((a, b) => a.latency_ms - b.latency_ms)[0]
    : null;

  const bestSizeAlg = rankedAlgorithms.length > 0
    ? [...rankedAlgorithms].sort((a, b) => a.model_size_mb - b.model_size_mb)[0]
    : null;

  const bestEnergyAlg = rankedAlgorithms.length > 0
    ? [...rankedAlgorithms].sort((a, b) => a.energy_j - b.energy_j)[0]
    : null;

  const bestOverall = rankedAlgorithms.length > 0 ? rankedAlgorithms[0] : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Zone A: Current Experiment Overview & Research Mission */}
      <div className="ws-panel p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-semibold text-[var(--accent)] uppercase tracking-wider">
                Active Research Experiment
              </span>
              <span className="text-[var(--text-muted)] font-mono text-xs">&bull;</span>
              <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                {latestExperiment?.id || 'NO ACTIVE EXPERIMENT'}
              </span>
              {latestExperiment?.is_demo && <ProvenanceBadge type="DEMO DATA" />}
            </div>
            <h2 className="text-base font-semibold text-[var(--text-primary)] leading-snug">
              Multi-Objective Metaheuristic Optimization for Deep CNN Compression
            </h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Evaluating trade-offs between classification accuracy, hardware latency, model footprint, and energy consumption across 10 standardized metaheuristics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNewBenchmark}
              className="flex items-center gap-1.5 px-3 py-1.5 ws-button-primary text-xs"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>New Benchmark</span>
            </button>
            {latestExperiment && (
              <button
                onClick={onViewResults}
                className="flex items-center gap-1.5 px-3 py-1.5 ws-button-secondary text-xs"
              >
                <BarChart3 className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>View Results</span>
              </button>
            )}
          </div>
        </div>

        {/* Experiment Parameters Strip */}
        {latestExperiment && (
          <div className="pt-3 border-t border-[var(--border)] grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs font-mono">
            <div>
              <span className="text-[var(--text-muted)] text-[11px] block">Dataset:</span>
              <span className="font-semibold text-[var(--text-primary)]">{latestExperiment.dataset_name}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] text-[11px] block">Model:</span>
              <span className="font-semibold text-[var(--text-primary)]">{latestExperiment.cnn_model_name}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] text-[11px] block">Quantization:</span>
              <span className="font-semibold text-[var(--text-primary)]">{latestExperiment.quantization_type}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] text-[11px] block">Pruning:</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {(latestExperiment.pruning_ratio * 100).toFixed(0)}% L1 Channel
              </span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] text-[11px] block">Runs &bull; Seed:</span>
              <span className="font-semibold text-[var(--text-primary)]">{latestExperiment.number_of_runs} runs &bull; #{latestExperiment.base_seed}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] text-[11px] block">Execution Status:</span>
              <span className="font-semibold text-[var(--success)]">{latestExperiment.status}</span>
            </div>
          </div>
        )}
      </div>

      {/* Zone B: Analytical Performance Summary Champions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="ws-section-title">Performance Summary &bull; Objective Leaders</h3>
          {bestOverall && (
            <span className="text-xs font-mono text-[var(--success)] font-medium">
              Overall Rank #1: {bestOverall.algorithm} ({bestOverall.overall_score.toFixed(1)} / 100)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Best Accuracy"
            value={bestAccAlg ? `${bestAccAlg.accuracy.toFixed(2)}%` : '--'}
            unit="Top-1"
            baselineValue={latestExperiment?.baseline.accuracy || 93.4}
            deltaPct={bestAccAlg ? bestAccAlg.accuracy - (latestExperiment?.baseline.accuracy || 93.4) : undefined}
            isHigherBetter={true}
            badgeLabel={bestAccAlg?.algorithm}
            provenance={latestExperiment?.is_demo ? 'DEMO DATA' : 'MEASURED'}
          />
          <MetricCard
            title="Lowest Latency"
            value={bestLatAlg ? `${bestLatAlg.latency_ms.toFixed(2)}` : '--'}
            unit="ms"
            baselineValue={latestExperiment?.baseline.latency_ms || 14.2}
            deltaPct={bestLatAlg ? -(((latestExperiment?.baseline.latency_ms || 14.2) - bestLatAlg.latency_ms) / (latestExperiment?.baseline.latency_ms || 14.2)) * 100 : undefined}
            isHigherBetter={false}
            badgeLabel={bestLatAlg?.algorithm}
            provenance={latestExperiment?.is_demo ? 'DEMO DATA' : 'MEASURED'}
          />
          <MetricCard
            title="Smallest Model"
            value={bestSizeAlg ? `${bestSizeAlg.model_size_mb.toFixed(2)}` : '--'}
            unit="MB"
            baselineValue={latestExperiment?.baseline.model_size_mb || 44.7}
            deltaPct={bestSizeAlg ? -(((latestExperiment?.baseline.model_size_mb || 44.7) - bestSizeAlg.model_size_mb) / (latestExperiment?.baseline.model_size_mb || 44.7)) * 100 : undefined}
            isHigherBetter={false}
            badgeLabel={bestSizeAlg?.algorithm}
            provenance={latestExperiment?.is_demo ? 'DEMO DATA' : 'CALCULATED'}
          />
          <MetricCard
            title="Lowest Energy"
            value={bestEnergyAlg ? `${bestEnergyAlg.energy_j.toFixed(4)}` : '--'}
            unit="J"
            baselineValue={latestExperiment?.baseline.energy_j || 0.38}
            deltaPct={bestEnergyAlg ? -(((latestExperiment?.baseline.energy_j || 0.38) - bestEnergyAlg.energy_j) / (latestExperiment?.baseline.energy_j || 0.38)) * 100 : undefined}
            isHigherBetter={false}
            badgeLabel={bestEnergyAlg?.algorithm}
            provenance={latestExperiment?.is_demo ? 'DEMO DATA' : 'ESTIMATED'}
          />
        </div>
      </div>

      {/* Zone C: Algorithm Comparison Workbench with Live Dynamic Reweighting */}
      {rankedAlgorithms.length > 0 && (
        <AlgorithmComparisonWorkbench
          rankedAlgorithms={rankedAlgorithms}
          paretoPoints={paretoPoints}
        />
      )}

      {/* Zone D: Experiment Activity Log */}
      <div className="ws-panel p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="ws-section-title">Experiment Activity Log</h3>
          <span className="text-xs font-mono text-[var(--text-muted)]">
            {experiments.length} Experiments Recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="ws-table font-mono text-xs">
            <thead>
              <tr>
                <th>Experiment ID</th>
                <th>Dataset &bull; Model</th>
                <th>Algorithms</th>
                <th>Status</th>
                <th>Top Performer</th>
                <th>Date / Time</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {experiments.slice(0, 5).map((exp) => (
                <tr key={exp.id}>
                  <td className="font-semibold text-[var(--accent)]">{exp.id}</td>
                  <td className="font-sans text-[var(--text-primary)]">
                    {exp.dataset_name} &bull; {exp.cnn_model_name}
                  </td>
                  <td className="text-[var(--text-secondary)]">
                    {exp.selected_algorithms?.length || 10} Optimizers
                  </td>
                  <td>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                      exp.status === 'COMPLETED'
                        ? 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/30'
                        : exp.status === 'RUNNING'
                        ? 'bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/30'
                        : 'bg-[var(--surface-secondary)] text-[var(--text-muted)]'
                    }`}>
                      {exp.status}
                    </span>
                  </td>
                  <td className="font-bold text-[var(--text-primary)]">{exp.best_algorithm || '--'}</td>
                  <td className="text-[var(--text-muted)]">{exp.created_at || 'Recent'}</td>
                  <td className="text-right">
                    <button
                      onClick={() => onOpenExperiment(exp.id)}
                      className="text-xs text-[var(--accent)] hover:underline inline-flex items-center gap-1 font-medium font-sans"
                    >
                      <span>Open Analysis</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {experiments.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-[var(--text-muted)]">
                    No experiments found. Click "New Benchmark" to configure your first run.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
