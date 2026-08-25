import React, { useState } from 'react';
import { Layers, Info } from 'lucide-react';
import { Experiment, AlgorithmStats } from '../../types';
import { BoxplotDistributionChart } from '../charts/BoxplotDistributionChart';

interface MultiRunStatsViewProps {
  experiment: Experiment;
  statistics: Record<string, AlgorithmStats>;
}

export const MultiRunStatsView: React.FC<MultiRunStatsViewProps> = ({
  experiment,
  statistics,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<
    'accuracy' | 'latency_ms' | 'model_size_mb' | 'energy_j' | 'overall_score'
  >('accuracy');

  const algKeys = Object.keys(statistics);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            MULTI-RUN STOCHASTIC STATISTICAL ANALYSIS &bull; {experiment.id}
          </h2>
          <p className="text-xs text-slate-400">
            Evaluating distribution across {experiment.number_of_runs} stochastic runs with seed policy: {experiment.random_seed_policy}.
          </p>
        </div>

        {/* Metric Selector Tab */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          {[
            { key: 'accuracy', label: 'Accuracy (%)' },
            { key: 'latency_ms', label: 'Latency (ms)' },
            { key: 'model_size_mb', label: 'Size (MB)' },
            { key: 'energy_j', label: 'Energy (J)' },
            { key: 'overall_score', label: 'Overall Score' },
          ].map((m) => (
            <button
              key={m.key}
              onClick={() => setSelectedMetric(m.key as any)}
              className={`px-3 py-1.5 rounded transition ${
                selectedMetric === m.key
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Boxplot Chart */}
      <BoxplotDistributionChart
        stats={statistics}
        metricKey={selectedMetric}
        height={360}
      />

      {/* Detailed Statistical Table */}
      <div className="lab-card p-4 space-y-3">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
          Statistical Summary Table ({experiment.number_of_runs} Repetitions Per Algorithm)
        </h4>

        <div className="overflow-x-auto">
          <table className="lab-table font-mono text-xs">
            <thead>
              <tr>
                <th>Algorithm</th>
                <th className="text-right">Runs</th>
                <th className="text-right">Mean</th>
                <th className="text-right">Std Dev</th>
                <th className="text-right">Median</th>
                <th className="text-right">Min</th>
                <th className="text-right">Max</th>
                <th className="text-right">95% Confidence Interval</th>
              </tr>
            </thead>
            <tbody>
              {algKeys.map((alg) => {
                const summary = statistics[alg][selectedMetric];
                return (
                  <tr key={alg}>
                    <td className="font-bold text-slate-100">{alg}</td>
                    <td className="text-right text-slate-400">{statistics[alg].runs_count}</td>
                    <td className="text-right font-bold text-amber-400">
                      {summary.mean.toFixed(selectedMetric === 'energy_j' ? 4 : 2)}
                    </td>
                    <td className="text-right text-slate-300">
                      &plusmn;{summary.std.toFixed(selectedMetric === 'energy_j' ? 4 : 2)}
                    </td>
                    <td className="text-right text-cyan-400 font-semibold">
                      {summary.median.toFixed(selectedMetric === 'energy_j' ? 4 : 2)}
                    </td>
                    <td className="text-right text-slate-400">
                      {summary.min_val.toFixed(selectedMetric === 'energy_j' ? 4 : 2)}
                    </td>
                    <td className="text-right text-slate-400">
                      {summary.max_val.toFixed(selectedMetric === 'energy_j' ? 4 : 2)}
                    </td>
                    <td className="text-right text-emerald-400">
                      [{summary.ci_95_lower.toFixed(selectedMetric === 'energy_j' ? 4 : 2)}, {summary.ci_95_upper.toFixed(selectedMetric === 'energy_j' ? 4 : 2)}]
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
