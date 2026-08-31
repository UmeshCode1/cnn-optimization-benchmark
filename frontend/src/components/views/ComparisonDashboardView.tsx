import React, { useState } from 'react';
import {
  Download,
  GitFork,
  TrendingDown,
  Layers2,
  Zap,
} from 'lucide-react';
import { Experiment, RankedAlgorithm, ParetoPoint, AlgorithmStats } from '../../types';
import { AlgorithmComparisonWorkbench } from '../common/AlgorithmComparisonWorkbench';
import { api } from '../../services/api';

interface ComparisonDashboardViewProps {
  experiment: Experiment;
  rankedAlgorithms: RankedAlgorithm[];
  statistics: Record<string, AlgorithmStats>;
  paretoPoints: ParetoPoint[];
  onRecalculateWeights: (weights: any, statMode?: string) => void;
  onCompareSelected: (selectedAlgs: string[]) => void;
  onViewPareto: () => void;
  onViewConvergence: () => void;
  onViewStatistics: () => void;
  onViewConfusion?: () => void;
}

// Compute power draw in milliwatts from energy (J) and latency (ms)
function computePowerMW(energy_j: number, latency_ms: number): number {
  if (!latency_ms || latency_ms <= 0) return 0;
  // Power = Energy / Time → W = J / s → mW = J / (ms/1000) = J * 1000 / ms
  return (energy_j * 1000) / latency_ms;
}

// Generate a text rationale explaining why an algorithm ranked where it did
function generateRationale(alg: RankedAlgorithm, rank: number, total: number): string {
  if (rank === 1) {
    return `Best composite trade-off: highest accuracy (${alg.accuracy.toFixed(1)}%) with competitive latency (${alg.latency_ms.toFixed(2)} ms) and minimal energy draw.`;
  }
  if (rank <= 3) {
    return `Strong performer — near-optimal accuracy with ${alg.latency_ms.toFixed(2)} ms latency and ${alg.energy_j.toFixed(4)} J energy per inference.`;
  }
  if (rank <= Math.ceil(total / 2)) {
    return `Mid-tier: trades lower accuracy (${alg.accuracy.toFixed(1)}%) for ${alg.latency_ms.toFixed(2)} ms latency; suitable for latency-sensitive deployments.`;
  }
  return `Lower composite score due to ${alg.accuracy.toFixed(1)}% accuracy and ${alg.latency_ms.toFixed(2)} ms latency — may excel with custom weight tuning.`;
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
  onViewConfusion,
}) => {
  const [sortKey, setSortKey] = useState<string>('overall_score');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [expandedRationale, setExpandedRationale] = useState<string | null>(null);

  const sortedAlgorithms = [...rankedAlgorithms].sort((a: any, b: any) => {
    if (sortKey === 'power_mw') {
      const aP = computePowerMW(a.energy_j, a.latency_ms);
      const bP = computePowerMW(b.energy_j, b.latency_ms);
      return sortAsc ? aP - bP : bP - aP;
    }
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
      const lowerBetter = ['latency_ms', 'model_size_mb', 'energy_j', 'accuracy_drop', 'parameters_m', 'flops_m', 'power_mw'];
      setSortAsc(lowerBetter.includes(key));
    }
  };

  const topAlgorithm = rankedAlgorithms.length > 0 ? rankedAlgorithms[0] : null;
  const baselineLatency = experiment?.baseline?.latency_ms || 14.2;

  // Compute power stats for relative coloring
  const allPowers = rankedAlgorithms.map((a) => computePowerMW(a.energy_j, a.latency_ms));
  const minPower = Math.min(...allPowers);
  const maxPower = Math.max(...allPowers);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="ws-page-title">Benchmark Results &amp; Comparative Analysis</h2>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
              {experiment?.id || '—'}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Empirical comparative benchmark across {experiment?.selected_algorithms?.length || 10} metaheuristic algorithms on {experiment?.cnn_model_name} ({experiment?.dataset_name}).
          </p>
        </div>

        {/* Quick Analytical Navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onViewPareto}
            className="flex items-center gap-1.5 px-3 py-1.5 ws-button-secondary text-xs cursor-pointer"
          >
            <GitFork className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Pareto Front</span>
          </button>
          <button
            onClick={onViewConvergence}
            className="flex items-center gap-1.5 px-3 py-1.5 ws-button-secondary text-xs cursor-pointer"
          >
            <TrendingDown className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Convergence</span>
          </button>
          <button
            onClick={onViewStatistics}
            className="flex items-center gap-1.5 px-3 py-1.5 ws-button-secondary text-xs cursor-pointer"
          >
            <Layers2 className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Multi-Run Stats</span>
          </button>
          {onViewConfusion && (
            <button
              onClick={onViewConfusion}
              className="flex items-center gap-1.5 px-3 py-1.5 ws-button-secondary text-xs cursor-pointer text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Confusion Matrix</span>
            </button>
          )}
        </div>
      </div>

      {/* Analytical Conclusion Panel */}
      {topAlgorithm && experiment && (
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
              Conditional on Weights: Acc {((experiment.weight_accuracy || 0) * 100).toFixed(0)}% &bull; Lat {((experiment.weight_latency || 0) * 100).toFixed(0)}% &bull; Size {((experiment.weight_model_size || 0) * 100).toFixed(0)}% &bull; Energy {((experiment.weight_energy || 0) * 100).toFixed(0)}%
            </span>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            <strong>{topAlgorithm.algorithm}</strong> achieved the highest composite trade-off score of{' '}
            <strong>{topAlgorithm.overall_score.toFixed(1)} / 100</strong> across {experiment.number_of_runs} independent runs, retaining{' '}
            <strong>{topAlgorithm.accuracy.toFixed(2)}%</strong> Top-1 accuracy with{' '}
            <strong>{topAlgorithm.latency_ms.toFixed(2)} ms</strong> latency (
            {((1 - topAlgorithm.latency_ms / baselineLatency) * 100).toFixed(1)}% acceleration),{' '}
            <strong>{topAlgorithm.model_size_mb.toFixed(2)} MB</strong> footprint, and{' '}
            <strong>{computePowerMW(topAlgorithm.energy_j, topAlgorithm.latency_ms).toFixed(3)} mW</strong> average power draw.
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
              N = {experiment?.number_of_runs || '—'} stochastic repetitions per algorithm &bull; Seed policy: {experiment?.random_seed_policy || '—'} &bull; Power = Energy / Latency
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
            {experiment?.id && (
              <a
                href={api.getExportUrl(experiment.id, 'csv')}
                download
                className="flex items-center gap-1.5 px-2.5 py-1 ws-button-secondary text-xs font-mono"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </a>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="ws-table font-mono text-xs">
            <thead>
              <tr>
                <th className="cursor-pointer whitespace-nowrap" onClick={() => handleSort('rank')}>
                  Rank {sortKey === 'rank' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="cursor-pointer whitespace-nowrap" onClick={() => handleSort('algorithm')}>
                  Algorithm {sortKey === 'algorithm' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="text-right cursor-pointer whitespace-nowrap" onClick={() => handleSort('overall_score')}>
                  Score {sortKey === 'overall_score' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="text-right cursor-pointer whitespace-nowrap" onClick={() => handleSort('accuracy')}>
                  Accuracy ↑ {sortKey === 'accuracy' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="text-right cursor-pointer whitespace-nowrap" onClick={() => handleSort('accuracy_drop')}>
                  Acc Drop ↓ {sortKey === 'accuracy_drop' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="text-right cursor-pointer whitespace-nowrap" onClick={() => handleSort('latency_ms')}>
                  Latency ↓ {sortKey === 'latency_ms' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="text-right cursor-pointer whitespace-nowrap" onClick={() => handleSort('model_size_mb')}>
                  Size (MB) ↓ {sortKey === 'model_size_mb' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="text-right cursor-pointer whitespace-nowrap" onClick={() => handleSort('energy_j')}>
                  Energy (J) ↓ {sortKey === 'energy_j' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="text-right cursor-pointer whitespace-nowrap" onClick={() => handleSort('power_mw')}>
                  <span className="flex items-center justify-end gap-1">
                    <Zap className="w-3 h-3 text-[var(--warning)]" />
                    Power (mW) ↓
                  </span>
                  {sortKey === 'power_mw' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="text-right cursor-pointer whitespace-nowrap" onClick={() => handleSort('parameters_m')}>
                  Params (M) {sortKey === 'parameters_m' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="text-right cursor-pointer whitespace-nowrap" onClick={() => handleSort('flops_m')}>
                  FLOPs (M) {sortKey === 'flops_m' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="text-center whitespace-nowrap">Pareto</th>
                <th className="text-center whitespace-nowrap">Rationale</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlgorithms.map((alg) => {
                const isLeader = alg.rank === 1;
                // Fix: use correct field name 'is_pareto' from ParetoPoint type
                const isPareto = paretoPoints.some((p) => p.algorithm === alg.algorithm && p.is_pareto);
                const powerMW = computePowerMW(alg.energy_j, alg.latency_ms);
                const powerPct = maxPower > minPower ? ((powerMW - minPower) / (maxPower - minPower)) * 100 : 50;
                const rationale = generateRationale(alg, alg.rank, rankedAlgorithms.length);
                const isRationaleExpanded = expandedRationale === alg.algorithm;

                return (
                  <React.Fragment key={alg.algorithm}>
                    <tr className={isLeader ? 'bg-blue-500/5' : ''}>
                      <td className="font-semibold text-[var(--text-muted)]">
                        #{alg.rank}
                      </td>
                      <td className="font-bold text-[var(--text-primary)] font-sans">
                        <div className="flex items-center gap-1.5">
                          <span>{alg.algorithm}</span>
                          {isLeader && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 font-mono font-bold uppercase">
                              Leader
                            </span>
                          )}
                          {isPareto && !isLeader && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20 font-mono">
                              Pareto
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-right font-bold text-[var(--accent)]">
                        {alg.overall_score.toFixed(1)}
                      </td>
                      <td className="text-right text-[var(--success)] font-semibold">
                        {alg.accuracy.toFixed(2)}%
                      </td>
                      <td className="text-right text-[var(--text-secondary)]">
                        {alg.accuracy_drop != null ? (
                          <span className={alg.accuracy_drop > 2 ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'}>
                            -{alg.accuracy_drop.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)]">—</span>
                        )}
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
                      {/* Power Consumption Column */}
                      <td className="text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className={`font-semibold ${powerPct > 66 ? 'text-[var(--danger)]' : powerPct > 33 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>
                            {powerMW.toFixed(3)} mW
                          </span>
                          <div className="w-16 h-1 bg-[var(--surface-secondary)] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${powerPct > 66 ? 'bg-[var(--danger)]' : powerPct > 33 ? 'bg-[var(--warning)]' : 'bg-[var(--success)]'}`}
                              style={{ width: `${powerPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="text-right text-[var(--text-muted)]">
                        {alg.parameters_m?.toFixed(2) || '—'} M
                      </td>
                      <td className="text-right text-[var(--text-muted)]">
                        {alg.flops_m?.toFixed(1) || '—'} M
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
                      {/* Rationale Column */}
                      <td className="text-center">
                        <button
                          onClick={() => setExpandedRationale(isRationaleExpanded ? null : alg.algorithm)}
                          className="text-[10px] font-mono text-[var(--accent)] hover:underline whitespace-nowrap"
                        >
                          {isRationaleExpanded ? 'Hide ▲' : `Why #${alg.rank}? ▼`}
                        </button>
                      </td>
                    </tr>
                    {/* Expanded Rationale Row */}
                    {isRationaleExpanded && (
                      <tr className="bg-[var(--surface-secondary)]">
                        <td colSpan={13} className="px-4 py-2">
                          <div className="flex items-start gap-2 text-[11px] font-sans text-[var(--text-secondary)]">
                            <span className="font-mono text-[var(--accent)] font-bold shrink-0">{alg.algorithm}:</span>
                            <span className="leading-relaxed">{rationale}</span>
                            <span className="ml-auto shrink-0 font-mono text-[var(--text-muted)]">
                              {computePowerMW(alg.energy_j, alg.latency_ms).toFixed(3)} mW &bull; {alg.energy_j.toFixed(4)} J/inf
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Power Consumption Summary Bar */}
        {rankedAlgorithms.length > 0 && (
          <div className="pt-3 border-t border-[var(--border)] space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-muted)]">
              <Zap className="w-3.5 h-3.5 text-[var(--warning)]" />
              <span className="uppercase tracking-wider font-semibold">Power Consumption Summary</span>
              <span className="text-[var(--text-muted)]">— Average draw per algorithm inference</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {rankedAlgorithms.map((alg) => {
                const pw = computePowerMW(alg.energy_j, alg.latency_ms);
                const pct = maxPower > minPower ? ((pw - minPower) / (maxPower - minPower)) * 100 : 50;
                return (
                  <div key={alg.algorithm} className="ws-panel p-2 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="font-bold text-[var(--text-primary)]">{alg.algorithm}</span>
                      <span className={`font-semibold ${pct > 66 ? 'text-[var(--danger)]' : pct > 33 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>
                        {pw.toFixed(3)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--surface-secondary)] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct > 66 ? 'bg-[var(--danger)]' : pct > 33 ? 'bg-[var(--warning)]' : 'bg-[var(--success)]'}`}
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                    <div className="text-[9px] font-mono text-[var(--text-muted)]">mW / inf</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
