import React from 'react';
import { TrendingDown, Info, Zap, Clock, Target, Award } from 'lucide-react';
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
  // Extract convergence curves per algorithm (use Run 1 as primary or best run)
  const curvesByAlg: Record<string, number[]> = {};

  runs.forEach((r) => {
    if (!curvesByAlg[r.algorithm] && r.convergence_curve && r.convergence_curve.length > 0) {
      curvesByAlg[r.algorithm] = r.convergence_curve;
    }
  });

  // Calculate high-level summary KPIs
  const sortedByFitness = [...runs].sort((a, b) => a.best_fitness - b.best_fitness);
  const bestRun = sortedByFitness[0];
  const totalEvaluations = runs.reduce((acc, r) => acc + (r.candidate_evaluations || 0), 0);
  const avgOptTime = runs.length > 0 ? runs.reduce((acc, r) => acc + (r.optimization_time_seconds || 0), 0) / runs.length : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center border border-[var(--accent)]/20">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] font-mono tracking-tight flex items-center gap-2">
                Metaheuristic Convergence Trajectories &amp; Step Analysis
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Empirical step-by-step cost minimization curves across {Object.keys(curvesByAlg).length} algorithms on {experiment.cnn_model_name}.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-secondary)]">
            {experiment.id} &bull; {experiment.max_iterations} Iterations
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
        <div className="ws-panel p-3.5 space-y-1">
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            Best Fitness Achieved
          </span>
          <div className="text-xl font-bold text-emerald-400">
            {bestRun ? bestRun.best_fitness.toFixed(4) : '—'}
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">
            Algorithm: <strong>{bestRun?.algorithm || '—'}</strong>
          </div>
        </div>

        <div className="ws-panel p-3.5 space-y-1">
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-[var(--accent)]" />
            Total Evaluations
          </span>
          <div className="text-xl font-bold text-[var(--accent)]">
            {totalEvaluations.toLocaleString()}
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">Across all runs</div>
        </div>

        <div className="ws-panel p-3.5 space-y-1">
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Avg Optimization Time
          </span>
          <div className="text-xl font-bold text-amber-400">
            {avgOptTime.toFixed(2)} s
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">Per algorithm search</div>
        </div>

        <div className="ws-panel p-3.5 space-y-1">
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            Evaluated Algorithms
          </span>
          <div className="text-xl font-bold text-purple-400">
            {Object.keys(curvesByAlg).length}
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">Population: {experiment.population_size}</div>
        </div>
      </div>

      {/* Analytical Guide Callout */}
      <div className="ws-panel p-4 bg-[var(--surface-secondary)]/40 border border-[var(--border)] flex items-start gap-3 rounded-xl">
        <Info className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--text-secondary)] space-y-1">
          <div className="font-bold text-[var(--text-primary)] font-mono text-xs">
            Understanding Trajectory Dynamics (Exploration vs Exploitation):
          </div>
          <p className="leading-relaxed">
            Metaheuristics with steep initial descent exhibit rapid exploitation of gradient-free parameter spaces. Algorithms maintaining steady, progressive slope descent explore broader dimensional landscapes to evade premature convergence into local minima.
          </p>
        </div>
      </div>

      {/* Main Interactive Convergence Line Chart */}
      <ConvergenceLineChart algorithmCurves={curvesByAlg} height={390} />

      {/* Iteration metrics table */}
      <div className="ws-panel p-5 space-y-3">
        <h4 className="text-xs font-bold text-[var(--text-primary)] font-mono uppercase tracking-wider flex items-center gap-2">
          Optimization Efficiency &amp; Computational Budget Breakdown
        </h4>

        <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
          <table className="ws-table font-mono text-xs">
            <thead>
              <tr>
                <th>Algorithm</th>
                <th className="text-right">Max Iterations</th>
                <th className="text-right">Candidate Evaluations</th>
                <th className="text-right">Optimization Time (s)</th>
                <th className="text-right">Final Best Cost ↓</th>
                <th className="text-right">Convergence Rate (Cost/sec)</th>
              </tr>
            </thead>
            <tbody>
              {runs.slice(0, 12).map((r) => {
                const initialFit = r.convergence_curve?.[0] || 1.0;
                const costDrop = initialFit - r.best_fitness;
                const rate = r.optimization_time_seconds > 0 ? costDrop / r.optimization_time_seconds : 0;
                return (
                  <tr key={r.algorithm + r.run_index}>
                    <td className="font-bold text-[var(--text-primary)]">{r.algorithm}</td>
                    <td className="text-right text-[var(--text-secondary)]">{experiment.max_iterations}</td>
                    <td className="text-right text-[var(--text-secondary)]">{r.candidate_evaluations}</td>
                    <td className="text-right text-[var(--text-secondary)]">{r.optimization_time_seconds.toFixed(2)} s</td>
                    <td className="text-right text-emerald-400 font-bold">{r.best_fitness.toFixed(4)}</td>
                    <td className="text-right text-[var(--accent)] font-semibold">{rate.toFixed(4)}/s</td>
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
