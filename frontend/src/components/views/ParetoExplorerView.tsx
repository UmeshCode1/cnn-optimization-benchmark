import React, { useState } from 'react';
import { GitFork, Info, ArrowRight } from 'lucide-react';
import { Experiment, ParetoPoint } from '../../types';
import { ScatterParetoChart } from '../charts/ScatterParetoChart';

interface ParetoExplorerViewProps {
  experiment: Experiment;
  paretoPoints: ParetoPoint[];
}

export const ParetoExplorerView: React.FC<ParetoExplorerViewProps> = ({
  experiment,
  paretoPoints,
}) => {
  const [xAxis, setXAxis] = useState<'latency_ms' | 'model_size_mb' | 'energy_j'>('latency_ms');
  const [onlyPareto, setOnlyPareto] = useState<boolean>(false);
  const [selectedPoint, setSelectedPoint] = useState<ParetoPoint | null>(null);

  const paretoSolutions = paretoPoints.filter((p) => p.is_pareto);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <GitFork className="w-5 h-5 text-emerald-400" />
            PARETO FRONTIER ANALYSIS &bull; {experiment.id}
          </h2>
          <p className="text-xs text-slate-400">
            Empirical multi-objective non-dominated solutions across accuracy, latency, size, and energy.
          </p>
        </div>
      </div>

      {/* Scientific explanation banner */}
      <div className="lab-card p-4 bg-slate-900/60 border-emerald-800/40 flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-1">
          <div className="font-bold text-slate-100 font-mono text-xs">
            Concept of Pareto Dominance in CNN Compression:
          </div>
          <p className="leading-relaxed">
            A solution $A$ dominates solution $B$ if $A$ achieves equal or better values across Accuracy, Latency, Size, and Energy, and is strictly superior in at least one metric. Solutions on the Pareto frontier cannot improve any single objective without degrading another.
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
      <div className="lab-card p-4 space-y-3">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
          Pareto-Optimal Solutions List ({paretoSolutions.length} Non-Dominated Models)
        </h4>

        <div className="overflow-x-auto">
          <table className="lab-table font-mono text-xs">
            <thead>
              <tr>
                <th>Algorithm</th>
                <th className="text-right">Accuracy (%) ↑</th>
                <th className="text-right">Latency (ms) ↓</th>
                <th className="text-right">Model Size (MB) ↓</th>
                <th className="text-right">Energy (J) ↓</th>
                <th className="text-right">Overall Score (/100)</th>
                <th className="text-center">Classification</th>
              </tr>
            </thead>
            <tbody>
              {paretoSolutions.map((p) => (
                <tr key={p.algorithm}>
                  <td className="font-bold text-slate-100">{p.algorithm}</td>
                  <td className="text-right text-emerald-400 font-semibold">{p.accuracy.toFixed(2)}%</td>
                  <td className="text-right text-slate-200">{p.latency_ms.toFixed(2)} ms</td>
                  <td className="text-right text-slate-200">{p.model_size_mb.toFixed(2)} MB</td>
                  <td className="text-right text-slate-200">{p.energy_j.toFixed(4)} J</td>
                  <td className="text-right font-bold text-blue-400">{p.overall_score.toFixed(1)}</td>
                  <td className="text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      NON-DOMINATED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
