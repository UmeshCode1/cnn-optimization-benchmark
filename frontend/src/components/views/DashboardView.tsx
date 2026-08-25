import React from 'react';
import {
  Activity,
  PlayCircle,
  BarChart3,
  GitFork,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Experiment, RankedAlgorithm } from '../../types';
import { MetricCard } from '../common/MetricCard';
import { ProvenanceBadge } from '../common/ProvenanceBadge';

interface DashboardViewProps {
  experiments: Experiment[];
  latestExperiment?: Experiment;
  rankedAlgorithms: RankedAlgorithm[];
  onNewBenchmark: () => void;
  onOpenExperiment: (expId: string) => void;
  onViewResults: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  experiments,
  latestExperiment,
  rankedAlgorithms,
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
      {/* Hero / Research Goal Banner */}
      <div className="lab-card p-6 bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border-blue-600/40 relative overflow-hidden">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-900/80 text-blue-300 border border-blue-600/40">
              CORE RESEARCH QUESTION
            </span>
            {latestExperiment?.is_demo && <ProvenanceBadge type="DEMO DATA" />}
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            “Which optimization algorithm provides the best trade-off between CNN accuracy, inference latency, model size, and energy consumption under identical experimental conditions?”
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Standardized metaheuristic benchmark evaluating 10 optimization algorithms (GWO, WOA, ALO, MFO, GOA, MVO, SCA, AOA, MGO, GMO) on identical datasets, splits, architectures, quantization, and pruning schedules.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={onNewBenchmark}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md shadow-md transition"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Launch New Benchmark</span>
          </button>
          {latestExperiment && (
            <button
              onClick={onViewResults}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md border border-slate-700 transition"
            >
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span>View Latest Results ({latestExperiment.id})</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Primary Metric Champion Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Current Benchmark Leaders &bull; Mode 1 &amp; Mode 2
          </h3>
          {bestOverall && (
            <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Best Overall Trade-off: #{bestOverall.rank} {bestOverall.algorithm} ({bestOverall.overall_score.toFixed(1)}/100)
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

      {/* Telemetry Summary & Recent Benchmarks Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Summary Stats */}
        <div className="lab-card p-4 space-y-3 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Laboratory Benchmarks Status
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center my-3">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <div className="text-xl font-bold font-mono text-emerald-400">{completedCount}</div>
                <div className="text-[10px] text-slate-400">Completed</div>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <div className="text-xl font-bold font-mono text-amber-400">{runningCount}</div>
                <div className="text-[10px] text-slate-400">Running / Queued</div>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <div className="text-xl font-bold font-mono text-rose-400">{failedCount}</div>
                <div className="text-[10px] text-slate-400">Failed</div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-900/70 rounded border border-slate-800 text-xs space-y-1.5 font-mono text-slate-300">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Target CNN:</span>
              <span className="font-semibold text-slate-200">{latestExperiment?.cnn_model_name || 'ResNet-18'}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Dataset:</span>
              <span className="font-semibold text-slate-200">{latestExperiment?.dataset_name || 'CIFAR-10'}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Quantization:</span>
              <span className="font-semibold text-slate-200">{latestExperiment?.quantization_type || 'INT8'}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Pruning:</span>
              <span className="font-semibold text-slate-200">{latestExperiment?.pruning_method || 'STRUCTURED_CHANNEL'} ({((latestExperiment?.pruning_ratio || 0.4)*100).toFixed(0)}%)</span>
            </div>
          </div>
        </div>

        {/* Right: Recent Benchmarks List */}
        <div className="lab-card p-4 lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Recent Experiment Runs
            </h4>
            <span className="text-[11px] font-mono text-slate-400">{experiments.length} Total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="lab-table">
              <thead>
                <tr>
                  <th>Experiment ID</th>
                  <th>Dataset / CNN</th>
                  <th>Algorithms</th>
                  <th>Status</th>
                  <th>Best Algorithm</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {experiments.slice(0, 5).map((exp) => (
                  <tr key={exp.id}>
                    <td className="font-mono text-xs font-medium text-blue-400">{exp.id}</td>
                    <td className="text-xs text-slate-300">{exp.dataset_name} &bull; {exp.cnn_model_name}</td>
                    <td className="text-xs font-mono text-slate-400">{exp.selected_algorithms?.length || 10} Algs</td>
                    <td>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        exp.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        exp.status === 'RUNNING' ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {exp.status}
                      </span>
                    </td>
                    <td className="font-mono text-xs font-bold text-emerald-400">{exp.best_algorithm || '--'}</td>
                    <td>
                      <button
                        onClick={() => onOpenExperiment(exp.id)}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                      >
                        Open <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
                {experiments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-500 text-xs">
                      No experiments recorded yet. Click "Launch New Benchmark" to begin!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
