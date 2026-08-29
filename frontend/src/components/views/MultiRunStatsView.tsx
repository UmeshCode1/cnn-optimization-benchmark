import React, { useState } from 'react';
import { Layers, Activity, Award, ShieldCheck, Zap, Cpu } from 'lucide-react';
import { Experiment, AlgorithmStats } from '../../types';
import { BoxplotDistributionChart, BoxplotMetricKey } from '../charts/BoxplotDistributionChart';

interface MultiRunStatsViewProps {
  experiment: Experiment;
  statistics: Record<string, AlgorithmStats>;
}

export const MultiRunStatsView: React.FC<MultiRunStatsViewProps> = ({
  experiment,
  statistics,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<BoxplotMetricKey>('accuracy');

  const algKeys = Object.keys(statistics);

  // Compute best and most stable algorithms for selectedMetric
  let bestMeanAlg = algKeys[0] || 'GWO';
  let mostStableAlg = algKeys[0] || 'GWO';
  let minStd = Infinity;
  const isLowerBetter = selectedMetric === 'latency_ms' || selectedMetric === 'model_size_mb' || selectedMetric === 'energy_j' || selectedMetric === 'power_w' || selectedMetric === 'flops_m';
  let bestMeanVal = isLowerBetter ? Infinity : -Infinity;

  algKeys.forEach((alg) => {
    const s = (statistics[alg] as any)?.[selectedMetric];
    if (s) {
      if (s.std < minStd) {
        minStd = s.std;
        mostStableAlg = alg;
      }
      const isBetter = isLowerBetter ? s.mean < bestMeanVal : s.mean > bestMeanVal;
      if (isBetter) {
        bestMeanVal = s.mean;
        bestMeanAlg = alg;
      }
    }
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
        <div>
          <h2 className="ws-page-title flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            <span>Multi-Run Stochastic Statistical Analysis &bull; {experiment.id}</span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Evaluating distribution across {experiment.number_of_runs} stochastic runs with seed policy: {experiment.random_seed_policy}.
          </p>
        </div>

        {/* Metric Selector Tab */}
        <div className="flex flex-wrap items-center gap-1 bg-[var(--surface-secondary)] p-1 rounded-lg border border-[var(--border)] text-xs font-mono">
          {[
            { key: 'accuracy', label: 'Accuracy (%)' },
            { key: 'latency_ms', label: 'Latency (ms)' },
            { key: 'power_w', label: 'Power (W)' },
            { key: 'energy_j', label: 'Energy (J)' },
            { key: 'flops_m', label: 'FLOPs (M)' },
            { key: 'model_size_mb', label: 'Size (MB)' },
            { key: 'overall_score', label: 'Score (/100)' },
          ].map((m) => (
            <button
              key={m.key}
              onClick={() => setSelectedMetric(m.key as BoxplotMetricKey)}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                selectedMetric === m.key
                  ? 'bg-[var(--accent)] text-white font-bold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Statistical Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="ws-panel p-4 flex items-center justify-between border-l-4 border-l-[var(--success)]">
          <div>
            <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Top Performer (Mean)</div>
            <div className="text-sm font-bold text-[var(--text-primary)] font-mono mt-0.5">{bestMeanAlg}</div>
            <div className="text-[11px] text-[var(--success)] font-mono font-semibold">
              Mean: {(statistics[bestMeanAlg] as any)?.[selectedMetric]?.mean?.toFixed(selectedMetric === 'energy_j' ? 4 : 2) || '--'}
            </div>
          </div>
          <Award className="w-6 h-6 text-[var(--success)] opacity-80" />
        </div>

        <div className="ws-panel p-4 flex items-center justify-between border-l-4 border-l-purple-500">
          <div>
            <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Most Stable (Min &sigma;)</div>
            <div className="text-sm font-bold text-[var(--text-primary)] font-mono mt-0.5">{mostStableAlg}</div>
            <div className="text-[11px] text-purple-400 font-mono font-semibold">
              Std Dev: &plusmn;{(statistics[mostStableAlg] as any)?.[selectedMetric]?.std?.toFixed(selectedMetric === 'energy_j' ? 4 : 2) || '--'}
            </div>
          </div>
          <ShieldCheck className="w-6 h-6 text-purple-400 opacity-80" />
        </div>

        <div className="ws-panel p-4 flex items-center justify-between border-l-4 border-l-[var(--accent)]">
          <div>
            <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Statistical Protocol</div>
            <div className="text-sm font-bold text-[var(--text-primary)] font-mono mt-0.5">{experiment.number_of_runs} Runs / Algorithm</div>
            <div className="text-[11px] text-[var(--accent)] font-mono font-semibold">95% Student's t CI</div>
          </div>
          <Activity className="w-6 h-6 text-[var(--accent)] opacity-80" />
        </div>
      </div>

      {/* Main Boxplot Chart */}
      <BoxplotDistributionChart
        stats={statistics}
        metricKey={selectedMetric}
        height={360}
      />

      {/* Detailed Statistical Table */}
      <div className="ws-panel p-5 space-y-3">
        <h4 className="ws-section-title">
          Statistical Summary Table ({experiment.number_of_runs} Repetitions Per Algorithm)
        </h4>

        <div className="overflow-x-auto">
          <table className="ws-table font-mono text-xs">
            <thead>
              <tr>
                <th>Algorithm</th>
                <th className="text-right">Runs</th>
                <th className="text-right">Mean</th>
                <th className="text-right">Std Dev (σ)</th>
                <th className="text-right">Median</th>
                <th className="text-right">Min</th>
                <th className="text-right">Max</th>
                <th className="text-right">95% Confidence Interval</th>
              </tr>
            </thead>
            <tbody>
              {algKeys.map((alg) => {
                const summary = (statistics[alg] as any)?.[selectedMetric];
                if (!summary) return null;
                return (
                  <tr key={alg}>
                    <td className="font-bold text-[var(--text-primary)]">{alg}</td>
                    <td className="text-right text-[var(--text-muted)]">{statistics[alg].runs_count}</td>
                    <td className="text-right font-bold text-amber-400">
                      {summary.mean.toFixed(selectedMetric === 'energy_j' ? 4 : 2)}
                    </td>
                    <td className="text-right text-[var(--text-secondary)]">
                      &plusmn;{summary.std.toFixed(selectedMetric === 'energy_j' ? 4 : 2)}
                    </td>
                    <td className="text-right text-cyan-400 font-semibold">
                      {summary.median.toFixed(selectedMetric === 'energy_j' ? 4 : 2)}
                    </td>
                    <td className="text-right text-[var(--text-muted)]">
                      {summary.min_val.toFixed(selectedMetric === 'energy_j' ? 4 : 2)}
                    </td>
                    <td className="text-right text-[var(--text-muted)]">
                      {summary.max_val.toFixed(selectedMetric === 'energy_j' ? 4 : 2)}
                    </td>
                    <td className="text-right text-[var(--success)] font-medium">
                      [{summary.ci_95_lower.toFixed(selectedMetric === 'energy_j' ? 4 : 2)},{' '}
                      {summary.ci_95_upper.toFixed(selectedMetric === 'energy_j' ? 4 : 2)}]
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
