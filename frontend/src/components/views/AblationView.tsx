import React from 'react';
import { Layers2, CheckCircle2 } from 'lucide-react';
import { Experiment, AblationRecord } from '../../types';

interface AblationViewProps {
  experiment: Experiment;
  ablations: AblationRecord[];
}

export const AblationView: React.FC<AblationViewProps> = ({
  experiment,
  ablations,
}) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Layers2 className="w-5 h-5 text-cyan-500" />
            ABLATION STUDY: SEQUENTIAL COMPRESSION DECOMPOSITION
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Deconstructs the cumulative contribution of baseline, quantization, pruning, and metaheuristic tuning.
          </p>
        </div>
      </div>

      {/* Sequential Stages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {ablations.map((a, idx) => (
          <div
            key={a.stage_name}
            className={`lab-card p-3.5 flex flex-col justify-between ${
              idx === ablations.length - 1
                ? 'border-emerald-500/60 bg-emerald-500/5'
                : 'hover:border-blue-500/40'
            }`}
          >
            <div>
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                Stage {a.stage_order}
              </div>
              <h4 className="text-xs font-bold text-[var(--text-primary)] mt-1 leading-tight">
                {a.stage_name}
              </h4>
              <p className="text-[11px] text-[var(--text-secondary)] mt-2 leading-relaxed">
                {a.description}
              </p>
            </div>

            <div className="mt-4 pt-2.5 border-t border-[var(--border-color)] space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)]">Accuracy:</span>
                <strong className="text-emerald-500 font-bold">{a.accuracy.toFixed(2)}%</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)]">Latency:</span>
                <strong className="text-cyan-500 font-bold">{a.latency_ms.toFixed(2)} ms</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)]">Size:</span>
                <strong className="text-purple-500 font-bold">{a.model_size_mb.toFixed(2)} MB</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)]">Energy:</span>
                <strong className="text-amber-500 font-bold">{a.energy_j.toFixed(4)} J</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparative Table */}
      <div className="lab-card p-5 space-y-3">
        <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
          Ablation Stage Metrics Table
        </h4>

        <div className="overflow-x-auto">
          <table className="lab-table font-mono text-xs">
            <thead>
              <tr>
                <th>Stage Order</th>
                <th>Optimization Stage</th>
                <th className="text-right">Accuracy (%) ↑</th>
                <th className="text-right">Latency (ms) ↓</th>
                <th className="text-right">Model Size (MB) ↓</th>
                <th className="text-right">Energy (J) ↓</th>
                <th className="text-right">Parameters (M)</th>
                <th className="text-right">FLOPs (MFLOPs)</th>
              </tr>
            </thead>
            <tbody>
              {ablations.map((a) => (
                <tr key={a.stage_order}>
                  <td className="text-[var(--text-muted)] font-semibold">#{a.stage_order}</td>
                  <td className="font-bold text-[var(--text-primary)]">{a.stage_name}</td>
                  <td className="text-right text-emerald-500 font-bold">{a.accuracy.toFixed(2)}%</td>
                  <td className="text-right text-cyan-500 font-semibold">{a.latency_ms.toFixed(2)} ms</td>
                  <td className="text-right text-purple-500 font-semibold">{a.model_size_mb.toFixed(2)} MB</td>
                  <td className="text-right text-amber-500 font-semibold">{a.energy_j.toFixed(4)} J</td>
                  <td className="text-right text-[var(--text-secondary)]">{a.parameters_m.toFixed(2)} M</td>
                  <td className="text-right text-[var(--text-secondary)]">{a.flops_m.toFixed(1)} M</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
