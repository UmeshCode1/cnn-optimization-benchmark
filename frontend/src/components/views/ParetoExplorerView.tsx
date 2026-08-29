import React, { useState } from 'react';
import { GitFork, Info, Zap, Cpu } from 'lucide-react';
import { Experiment, ParetoPoint } from '../../types';
import { ScatterParetoChart, ParetoAxisType } from '../charts/ScatterParetoChart';

interface ParetoExplorerViewProps {
  experiment: Experiment;
  paretoPoints: ParetoPoint[];
}

export const ParetoExplorerView: React.FC<ParetoExplorerViewProps> = ({
  experiment,
  paretoPoints,
}) => {
  const [xAxis, setXAxis] = useState<ParetoAxisType>('latency_ms');
  const [onlyPareto, setOnlyPareto] = useState<boolean>(false);
  const [selectedPoint, setSelectedPoint] = useState<ParetoPoint | null>(null);

  const paretoSolutions = paretoPoints.filter((p) => p.is_pareto || p.is_pareto_optimal);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="ws-page-title">Multi-Objective Pareto Analysis</h2>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
              {experiment.id}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Empirical non-dominated trade-off boundary across Accuracy, Latency, Size, Energy, FLOPs, and Power metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-[var(--text-muted)]">Non-Dominated Solutions:</span>
          <span className="px-2 py-0.5 rounded bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/30 font-semibold">
            {paretoSolutions.length} / {paretoPoints.length} Optimal
          </span>
        </div>
      </div>

      {/* Scientific Explanation Panel */}
      <div className="ws-panel p-4 bg-blue-500/5 border-blue-500/30 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--text-secondary)] space-y-1">
          <div className="font-semibold text-[var(--text-primary)] font-mono text-xs">
            Concept of Multi-Objective Pareto Dominance:
          </div>
          <p className="leading-relaxed">
            A solution <strong>A</strong> dominates solution <strong>B</strong> if <strong>A</strong> is at least equal to <strong>B</strong> across all evaluation objectives (Accuracy ↑, Latency ↓, Model Size ↓, Energy / Power ↓, FLOPs ↓) and strictly superior in at least one metric. Solutions on the Pareto frontier represent optimal trade-offs where no metric can improve without sacrificing another.
          </p>
        </div>
      </div>

      {/* Main Scatter Plot */}
      <ScatterParetoChart
        points={paretoPoints}
        xAxis={xAxis}
        onXAxisChange={setXAxis}
        onlyPareto={onlyPareto}
        onToggleOnlyPareto={setOnlyPareto}
        onSelectPoint={setSelectedPoint}
        height={380}
      />

      {/* Pareto Solutions Table */}
      <div className="ws-panel p-5 space-y-3">
        <h4 className="ws-section-title">
          Pareto-Optimal Solutions List ({paretoSolutions.length} Non-Dominated Models)
        </h4>

        <div className="overflow-x-auto">
          <table className="ws-table font-mono text-xs">
            <thead>
              <tr>
                <th>Algorithm</th>
                <th className="text-right">Accuracy (%) ↑</th>
                <th className="text-right">Latency (ms) ↓</th>
                <th className="text-right">FLOPs (M)</th>
                <th className="text-right">Power / Energy ↓</th>
                <th className="text-right">TOPs (Throughput)</th>
                <th className="text-right">Model Size (MB) ↓</th>
                <th className="text-right">Composite Score</th>
                <th className="text-center">Pareto Classification</th>
              </tr>
            </thead>
            <tbody>
              {paretoSolutions.map((p: any) => {
                const powerW = p.power_w || (p.energy_j / Math.max(0.0001, p.latency_ms * 0.001));
                const flopsM = p.flops_m || (p.parameters_m ? p.parameters_m * 50 : 330.0);
                const tops = p.tops || ((flopsM * 1e6) / (Math.max(0.001, p.latency_ms) * 1e-3 * 1e12));

                return (
                  <tr key={p.algorithm}>
                    <td className="font-bold text-[var(--text-primary)] font-sans">{p.algorithm}</td>
                    <td className="text-right text-[var(--success)] font-semibold">{p.accuracy.toFixed(2)}%</td>
                    <td className="text-right text-[var(--text-primary)]">{p.latency_ms.toFixed(2)} ms</td>
                    <td className="text-right text-[var(--text-primary)]">{flopsM.toFixed(1)} M</td>
                    <td className="text-right">
                      <div className="text-[var(--text-primary)]">{p.energy_j.toFixed(4)} J</div>
                      <div className="text-[10px] text-[var(--text-muted)] font-sans">
                        {powerW.toFixed(2)} W ({((powerW * 1000)).toFixed(0)} mW)
                      </div>
                    </td>
                    <td className="text-right text-[var(--accent)] font-semibold">{tops.toFixed(3)} TOPs</td>
                    <td className="text-right text-[var(--text-secondary)]">{p.model_size_mb.toFixed(2)} MB</td>
                    <td className="text-right font-bold text-[var(--accent)]">{p.overall_score.toFixed(1)}</td>
                    <td className="text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/30 font-mono">
                        NON-DOMINATED
                      </span>
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
