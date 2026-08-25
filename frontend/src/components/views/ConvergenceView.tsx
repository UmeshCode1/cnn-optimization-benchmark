import React from 'react';
import { TrendingDown, Info } from 'lucide-react';
import { Experiment, ExperimentRun } from '../../types';
import { ConvergenceLineChart } from '../charts/ConvergenceLineChart';

interface ConvergenceViewProps {
  experiment: Experiment;
  runs: ExperimentRun[];
}

export const ConvergenceView: React.FC<ConvergenceViewProps> = ({
  experiment,
  runs,
}) => {
  // Extract convergence curves per algorithm (use Run 1 as primary or average)
  const curvesByAlg: Record<string, number[]> = {};

  runs.forEach((r) => {
    if (!curvesByAlg[r.algorithm] && r.convergence_curve && r.convergence_curve.length > 0) {
      curvesByAlg[r.algorithm] = r.convergence_curve;
    }
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-blue-400" />
            CONVERGENCE SPEED &amp; BEHAVIOR &bull; {experiment.id}
          </h2>
          <p className="text-xs text-slate-400">
            Evolution of multi-objective cost fitness over {experiment.max_iterations} iterations.
          </p>
        </div>
      </div>

      <div className="lab-card p-4 bg-slate-900/60 border-blue-800/40 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-1">
          <div className="font-bold text-slate-100 font-mono text-xs">
            Understanding Metaheuristic Convergence Trajectories:
          </div>
          <p className="leading-relaxed">
            Algorithms with steep initial descent (e.g. GWO, GMO) demonstrate rapid exploitation, whereas algorithms maintaining gradual downward slopes (e.g. WOA, MGO) explore wider parameter spaces to avoid local minima.
          </p>
        </div>
      </div>

      <ConvergenceLineChart algorithmCurves={curvesByAlg} height={380} />

      {/* Iteration metrics table */}
      <div className="lab-card p-4 space-y-3">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
          Optimization Efficiency Metrics
        </h4>

        <div className="overflow-x-auto">
          <table className="lab-table font-mono text-xs">
            <thead>
              <tr>
                <th>Algorithm</th>
                <th className="text-right">Iterations</th>
                <th className="text-right">Candidate Evaluations</th>
                <th className="text-right">Optimization Time (s)</th>
                <th className="text-right">Final Best Cost ↓</th>
              </tr>
            </thead>
            <tbody>
              {runs.slice(0, 10).map((r) => (
                <tr key={r.algorithm + r.run_index}>
                  <td className="font-bold text-slate-100">{r.algorithm}</td>
                  <td className="text-right text-slate-300">{experiment.max_iterations}</td>
                  <td className="text-right text-slate-300">{r.candidate_evaluations}</td>
                  <td className="text-right text-slate-300">{r.optimization_time_seconds.toFixed(2)} s</td>
                  <td className="text-right text-emerald-400 font-bold">{r.best_fitness.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
