import React, { useState } from 'react';
import {
  ArrowUpDown,
  Download,
  CheckCircle2,
  Sliders,
  Filter,
  RefreshCw,
  GitFork,
  ArrowRight,
  TrendingDown,
  Layers2,
  HelpCircle,
} from 'lucide-react';
import { Experiment, RankedAlgorithm, ParetoPoint, AlgorithmStats } from '../../types';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { AlgorithmComparisonWorkbench } from '../common/AlgorithmComparisonWorkbench';
import { api } from '../../services/api';

interface ComparisonDashboardViewProps {
  experiment: Experiment;
  rankedAlgorithms: RankedAlgorithm[];
  statistics: Record<string, AlgorithmStats>;
  paretoPoints: ParetoPoint[];
  onRecalculateWeights: (weights: any, statMode: string) => void;
  onCompareSelected: (selectedAlgs: string[]) => void;
  onViewPareto: () => void;
  onViewConvergence: () => void;
  onViewStatistics: () => void;
}

export const ComparisonDashboardView: React.FC<ComparisonDashboardViewProps> = ({
  experiment,
  rankedAlgorithms,
  statistics,
  paretoPoints,
  onRecalculateWeights,
  onCompareSelected,
  onViewPareto,
  onViewConvergence,
  onViewStatistics,
}) => {
  const [sortKey, setSortKey] = useState<string>('overall_score');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [filterQuery, setFilterQuery] = useState<string>('');

  const sortedAlgorithms = [...rankedAlgorithms].sort((a: any, b: any) => {
    let valA = a[sortKey] ?? 0;
    let valB = b[sortKey] ?? 0;
    if (typeof valA === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortAsc ? valA - valB : valB - valA;
  });

  const filteredAlgorithms = sortedAlgorithms.filter((a) =>
    a.algorithm.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      const lowerBetter = ['latency_ms', 'model_size_mb', 'energy_j', 'accuracy_drop', 'parameters_m', 'flops_m'];
      setSortAsc(lowerBetter.includes(key));
    }
  };

  const topAlgorithm = rankedAlgorithms.length > 0 ? rankedAlgorithms[0] : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header: Research Manifest & Context */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="ws-page-title">Benchmark Results &amp; Comparative Analysis</h2>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
              {experiment.id}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Empirical comparative benchmark across {experiment.selected_algorithms?.length || 10} metaheuristic algorithms on {experiment.cnn_model_name} ({experiment.dataset_name}).
          </p>
        </div>

        {/* Quick Analytical Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={onViewPareto}
            className="flex items-center gap-1.5 px-3 py-1.5 ws-button-secondary text-xs"
          >
            <GitFork className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Pareto Front</span>
          </button>
          <button
            onClick={onViewConvergence}
            className="flex items-center gap-1.5 px-3 py-1.5 ws-button-secondary text-xs"
          >
            <TrendingDown className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Convergence</span>
          </button>
          <button
            onClick={onViewStatistics}
            className="flex items-center gap-1.5 px-3 py-1.5 ws-button-secondary text-xs"
          >
            <Layers2 className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Multi-Run Stats</span>
          </button>
        </div>
      </div>

      {/* Analytical Conclusion Panel */}
      {topAlgorithm && (
        <div className="ws-panel p-5 space-y-3 bg-gradient-to-r from-blue-500/5 to-transparent border-blue-500/30">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--accent)]">
                Benchmark Conclusion
              </span>
              <span className="text-[var(--text-muted)]">&bull;</span>
              <span className="text-xs text-[var(--text-primary)] font-semibold font-mono">
                Optimal Multi-Objective Performer: {topAlgorithm.algorithm}
              </span>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              Conditional on Weights: Acc {(experiment.weight_accuracy * 100).toFixed(0)}% &bull; Lat {(experiment.weight_latency * 100).toFixed(0)}% &bull; Size {(experiment.weight_model_size * 100).toFixed(0)}% &bull; Energy {(experiment.weight_energy * 100).toFixed(0)}%
            </span>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            <strong>{topAlgorithm.algorithm}</strong> achieved the highest composite trade-off score of <strong>{topAlgorithm.overall_score.toFixed(1)} / 100</strong> across {experiment.number_of_runs} independent runs, retaining <strong>{topAlgorithm.accuracy.toFixed(2)}%</strong> Top-1 accuracy with <strong>{topAlgorithm.latency_ms.toFixed(2)} ms</strong> latency ({((1 - topAlgorithm.latency_ms / (experiment.baseline?.latency_ms || 14.2)) * 100).toFixed(1)}% acceleration) and <strong>{topAlgorithm.model_size_mb.toFixed(2)} MB</strong> footprint.
          </p>
        </div>
      )}

      {/* Comparison Workbench */}
      {rankedAlgorithms.length > 0 && (
        <AlgorithmComparisonWorkbench
          rankedAlgorithms={rankedAlgorithms}
          paretoPoints={paretoPoints}
        />
      )}

      {/* Comprehensive Raw Benchmark Metrics Table */}
      <div className="ws-panel p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="ws-section-title">Standardized Benchmark Evaluation Matrix</h3>
            <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
              N = {experiment.number_of_runs} stochastic repetitions per algorithm &bull; Seed policy: {experiment.random_seed_policy}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Filter algorithm..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="ws-input px-2.5 py-1 text-xs font-mono w-44"
              />
            </div>
            <a
              href={api.getExportUrl(experiment.id, 'csv')}
              download
              className="flex items-center gap-1.5 px-2.5 py-1 ws-button-secondary text-xs font-mono"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="ws-table font-mono text-xs">
            <thead>
              <tr>
                <th className="cursor-pointer" onClick={() => handleSort('rank')}>
                  Rank {sortKey === 'rank' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="cursor-pointer" onClick={() => handleSort('algorithm')}>
                  Algorithm {sortKey === 'algorithm' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="text-right cursor-pointer" onClick={() => handleSort('overall_score')}>
                  Composite Score {sortKey === 'overall_score' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="text-right cursor-pointer" onClick={() => handleSort('accuracy')}>
                  Accuracy (%) ↑ {sortKey === 'accuracy' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="text-right cursor-pointer" onClick={() => handleSort('latency_ms')}>
                  Latency (ms) ↓ {sortKey === 'latency_ms' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="text-right cursor-pointer" onClick={() => handleSort('model_size_mb')}>
                  Size (MB) ↓ {sortKey === 'model_size_mb' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="text-right cursor-pointer" onClick={() => handleSort('energy_j')}>
                  Energy (J) ↓ {sortKey === 'energy_j' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="text-right cursor-pointer" onClick={() => handleSort('parameters_m')}>
                  Params (M) {sortKey === 'parameters_m' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="text-right cursor-pointer" onClick={() => handleSort('flops_m')}>
                  FLOPs (M) {sortKey === 'flops_m' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="text-center">Pareto Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlgorithms.map((alg) => {
                const isLeader = alg.rank === 1;
                const isPareto = paretoPoints.some((p) => p.algorithm === alg.algorithm && p.is_pareto_optimal);

                return (
                  <tr key={alg.algorithm} className={isLeader ? 'bg-blue-500/5' : ''}>
                    <td className="font-semibold text-[var(--text-muted)]">
                      #{alg.rank}
                    </td>
                    <td className="font-bold text-[var(--text-primary)] font-sans">
                      {alg.algorithm}
                    </td>
                    <td className="text-right font-bold text-[var(--accent)]">
                      {alg.overall_score.toFixed(1)}
                    </td>
                    <td className="text-right text-[var(--success)] font-semibold">
                      {alg.accuracy.toFixed(2)}%
                    </td>
                    <td className="text-right text-[var(--text-primary)]">
                      {alg.latency_ms.toFixed(2)} ms
                    </td>
                    <td className="text-right text-[var(--text-secondary)]">
                      {alg.model_size_mb.toFixed(2)} MB
                    </td>
                    <td className="text-right text-[var(--text-secondary)]">
                      {alg.energy_j.toFixed(4)} J
                    </td>
                    <td className="text-right text-[var(--text-muted)]">
                      {alg.parameters_m?.toFixed(2) || '--'} M
                    </td>
                    <td className="text-right text-[var(--text-muted)]">
                      {alg.flops_m?.toFixed(1) || '--'} M
                    </td>
                    <td className="text-center">
                      {isPareto ? (
                        <span className="text-[10px] text-[var(--success)] bg-[var(--success)]/10 border border-[var(--success)]/30 px-1.5 py-0.5 rounded font-mono">
                          Optimal
                        </span>
                      ) : (
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">
                          Dominated
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
