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
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Layers2 className="w-5 h-5 text-cyan-400" />
            ABLATION STUDY: SEQUENTIAL COMPRESSION DECOMPOSITION
          </h2>
          <p className="text-xs text-slate-400">
            Deconstructs the cumulative contribution of baseline, quantization, pruning, and metaheuristic tuning.
          </p>
        </div>
      </div>

      {/* Sequential Stages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {ablations.map((a, idx) => (
          <div
            key={a.stage_name}
            className={`lab-card p-3 flex flex-col justify-between ${
              idx === ablations.length - 1 ? 'border-emerald-600 bg-emerald-950/20' : ''
            }`}
          >
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Stage {a.stage_order}</div>
              <h4 className="text-xs font-bold text-slate-100 mt-0.5 leading-tight">{a.stage_name}</h4>
              <p className="text-[11px] text-slate-400 mt-2">{a.description}</p>
            </div>

            <div className="mt-4 pt-2 border-t border-slate-800 space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Accuracy:</span>
                <strong className="text-emerald-400">{a.accuracy.toFixed(2)}%</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Latency:</span>
                <strong className="text-cyan-400">{a.latency_ms.toFixed(2)} ms</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Size:</span>
                <strong className="text-purple-400">{a.model_size_mb.toFixed(2)} MB</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Energy:</span>
                <strong className="text-amber-400">{a.energy_j.toFixed(4)} J</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparative Table */}
      <div className="lab-card p-4 space-y-3">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
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
                  <td className="text-slate-400">#{a.stage_order}</td>
                  <td className="font-bold text-slate-100">{a.stage_name}</td>
                  <td className="text-right text-emerald-400 font-semibold">{a.accuracy.toFixed(2)}%</td>
                  <td className="text-right text-cyan-400">{a.latency_ms.toFixed(2)} ms</td>
                  <td className="text-right text-purple-400">{a.model_size_mb.toFixed(2)} MB</td>
                  <td className="text-right text-amber-400">{a.energy_j.toFixed(4)} J</td>
                  <td className="text-right text-slate-300">{a.parameters_m.toFixed(2)} M</td>
                  <td className="text-right text-slate-300">{a.flops_m.toFixed(1)} M</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
