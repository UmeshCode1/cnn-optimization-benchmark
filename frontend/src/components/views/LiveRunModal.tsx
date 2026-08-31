import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2, AlertCircle, Sparkles, X, Cpu, Layers, Zap, TrendingUp, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';

interface LiveRunModalProps {
  experimentId: string;
  onClose: () => void;
  onCompleted: () => void;
}

export const LiveRunModal: React.FC<LiveRunModalProps> = ({
  experimentId,
  onClose,
  onCompleted,
}) => {
  const [status, setStatus] = useState<string>('RUNNING');
  const [progressPct, setProgressPct] = useState<number>(0);
  const [currentAlgorithm, setCurrentAlgorithm] = useState<string>('Initializing Baseline...');
  const [currentRunIndex, setCurrentRunIndex] = useState<number>(1);
  const [totalRuns, setTotalRuns] = useState<number>(5);
  const [logs, setLogs] = useState<string[]>([]);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [latestMetrics, setLatestMetrics] = useState<{ accuracy?: number; latency?: number; score?: number } | null>(null);

  useEffect(() => {
    let isSubscribed = true;
    let pollInterval: any = null;

    // Polling fallback to guarantee updates even if WebSocket drops
    const startPolling = () => {
      if (pollInterval) return;
      pollInterval = setInterval(async () => {
        if (!isSubscribed) return;
        try {
          const details = await api.getExperiment(experimentId);
          if (details && details.experiment) {
            const exp = details.experiment;
            if (exp.status === 'COMPLETED') {
              setProgressPct(100);
              setStatus('COMPLETED');
              setIsDone(true);
              setCurrentAlgorithm(exp.best_algorithm || 'Optimization Completed');
              setLogs((prev) => [
                `[STAGE 5/5: COMPLETE] Benchmark completed. Winner: ${exp.best_algorithm || 'Optimal'}. All Pareto frontiers and 95% Confidence Intervals extracted.`,
                ...prev.slice(0, 40),
              ]);
              if (pollInterval) clearInterval(pollInterval);
            } else if (exp.status === 'FAILED' || exp.status === 'CANCELLED' || exp.status === 'INTERRUPTED') {
              setStatus(exp.status);
              setIsDone(true);
              setLogs((prev) => [`[${exp.status}] Benchmark ${exp.status.toLowerCase()}: ${exp.error_message || 'Stopped'}`, ...prev]);
              if (pollInterval) clearInterval(pollInterval);
            } else if (details.runs && details.runs.length > 0) {
              const completedCount = details.runs.length;
              const expectedTotal = (exp.selected_algorithms?.length || 10) * (exp.number_of_runs || 5);
              const pct = Math.min(95, Math.round((completedCount / (expectedTotal || 1)) * 100));
              setProgressPct(pct);
              const lastRun = details.runs[details.runs.length - 1];
              setCurrentAlgorithm(lastRun.algorithm);
              setCurrentRunIndex(lastRun.run_index);
              setLatestMetrics({
                accuracy: lastRun.accuracy,
                latency: lastRun.latency_ms,
                score: lastRun.overall_score,
              });
            }
          }
        } catch (e) {
          // ignore poll errors
        }
      }, 1000);
    };

    const ws = api.createProgressWebSocket(experimentId, (data) => {
      if (!isSubscribed) return;
      if (data.event === 'RUN_START') {
        setCurrentAlgorithm(data.algorithm);
        setCurrentRunIndex(data.run_index);
        if (data.total_runs) setTotalRuns(data.total_runs);
        setProgressPct(data.progress_pct);
        setLogs((prev) => [
          `[STAGE 4/5: OPTIMIZING] ${data.algorithm} &bull; Stochastic Run #${data.run_index}/${data.total_runs || totalRuns} initiated.`,
          ...prev.slice(0, 40),
        ]);
      } else if (data.event === 'RUN_COMPLETED') {
        setProgressPct(data.progress_pct);
        const m = data.run_data || data.metrics;
        setLatestMetrics({
          accuracy: m?.accuracy,
          latency: m?.latency_ms,
          score: m?.overall_score,
        });
        setLogs((prev) => [
          `[EVAL SUCCESS] ${data.algorithm} Run #${data.run_index} &rarr; Acc: ${m?.accuracy?.toFixed(2)}%, Lat: ${m?.latency_ms?.toFixed(2)}ms, Score: ${m?.overall_score?.toFixed(1)}/100`,
          ...prev.slice(0, 40),
        ]);
      } else if (data.event === 'BENCHMARK_COMPLETED') {
        setProgressPct(100);
        setStatus('COMPLETED');
        setIsDone(true);
        setLogs((prev) => [
          `[STAGE 5/5: COMPLETE] Benchmark completed. Winner: ${data.best_algorithm || 'Optimal'}. Computing Pareto frontiers & statistics.`,
          ...prev,
        ]);
        if (pollInterval) clearInterval(pollInterval);
      } else if (data.event === 'BENCHMARK_CANCELLED') {
        setStatus('CANCELLED');
        setIsDone(true);
        setLogs((prev) => [`[CANCELLED] Benchmark execution was cancelled by user.`, ...prev]);
        if (pollInterval) clearInterval(pollInterval);
      } else if (data.event === 'BENCHMARK_FAILED') {
        setStatus('FAILED');
        setIsDone(true);
        setLogs((prev) => [`[ERROR] Benchmark execution failed: ${data.error}`, ...prev]);
        if (pollInterval) clearInterval(pollInterval);
      }
    });

    startPolling();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      isSubscribed = false;
      window.removeEventListener('keydown', handleKeyDown);
      if (pollInterval) clearInterval(pollInterval);
      try {
        ws.close();
      } catch (e) {}
    };
  }, [experimentId]);

  // Determine current active pipeline stage (1 to 5)
  const getActiveStage = () => {
    if (isDone) return 5;
    if (progressPct < 15) return 1;
    if (progressPct < 30) return 2;
    if (progressPct < 50) return 3;
    if (progressPct < 90) return 4;
    return 5;
  };

  const activeStage = getActiveStage();

  const pipelineStages = [
    { num: 1, label: 'Baseline Profiling', desc: 'Pre-flight FLOPs & Accuracy Baseline' },
    { num: 2, label: 'Quantization Scaling', desc: 'Precision Mapping (FP16 / INT8)' },
    { num: 3, label: 'Sparsity Masking', desc: 'Structured Channel & Filter Pruning' },
    { num: 4, label: 'Swarm Optimization', desc: '10 Metaheuristic Search & Evaluations' },
    { num: 5, label: 'Pareto Extraction', desc: 'Non-Dominated Frontiers & CI Bounds' },
  ];

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <div className="ws-panel w-full max-w-2xl bg-[var(--surface-elevated)] border border-[var(--border-strong)] shadow-2xl rounded-xl p-6 space-y-5 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${isDone ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
              <Activity className={`w-5 h-5 ${isDone ? '' : 'animate-spin'}`} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {status === 'COMPLETED'
                  ? 'Benchmark Complete — Results Ready'
                  : status === 'FAILED' || status === 'INTERRUPTED' || status === 'CANCELLED'
                  ? `Benchmark ${status}`
                  : 'Benchmark Execution in Progress'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-mono">
                Experiment ID: <span className="text-[var(--accent)] font-semibold">{experimentId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Close modal (Esc)"
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step-by-Step 5-Stage Pipeline Progress Bar */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider flex justify-between">
            <span>Execution Pipeline (5 Stages)</span>
            <span className="text-[var(--accent)] font-bold">{progressPct.toFixed(0)}% Overall Progress</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 font-mono text-[10px]">
            {pipelineStages.map((stage) => {
              const isPast = activeStage > stage.num || isDone;
              const isCurrent = activeStage === stage.num && !isDone;

              return (
                <div
                  key={stage.num}
                  className={`p-2 rounded border transition-all text-center flex flex-col justify-between ${
                    isPast
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : isCurrent
                      ? 'bg-blue-500/15 border-blue-500 text-blue-300 shadow-md animate-pulse'
                      : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-muted)] opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 font-bold">
                    {isPast ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <span>{stage.num}.</span>}
                    <span className="truncate">{stage.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Animated Progress Track */}
          <div className="w-full bg-[var(--surface-secondary)] rounded-full h-2 overflow-hidden mt-1">
            <div
              className="bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 h-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Active Telemetry Ticker */}
        <div className="grid grid-cols-3 gap-3">
          <div className="ws-panel p-2.5 text-center">
            <span className="text-[10px] font-mono text-[var(--text-muted)] block">Active Algorithm</span>
            <span className="text-xs font-mono font-bold text-[var(--accent)] mt-0.5 truncate block">
              {currentAlgorithm}
            </span>
          </div>
          <div className="ws-panel p-2.5 text-center">
            <span className="text-[10px] font-mono text-[var(--text-muted)] block">Run Repetition</span>
            <span className="text-xs font-mono font-bold text-[var(--text-primary)] mt-0.5 block">
              Run #{currentRunIndex} of {totalRuns}
            </span>
          </div>
          <div className="ws-panel p-2.5 text-center">
            <span className="text-[10px] font-mono text-[var(--text-muted)] block">Latest Candidate Score</span>
            <span className="text-xs font-mono font-bold text-[var(--success)] mt-0.5 block">
              {latestMetrics?.score ? `${latestMetrics.score.toFixed(1)} / 100` : 'Calculating...'}
            </span>
          </div>
        </div>

        {/* Live Event Stream Log Terminal */}
        <div className="space-y-1">
          <div className="text-[11px] font-mono text-[var(--text-muted)] flex justify-between">
            <span>Telemetry &amp; Optimizer Stream Logs</span>
            <span className="text-[10px] text-emerald-400">● Live Feed</span>
          </div>
          <div className="bg-[var(--surface)] p-3 rounded-lg border border-[var(--border)] h-40 overflow-y-auto space-y-1 font-mono text-[11px] text-[var(--text-secondary)]">
            <div className="text-[var(--text-muted)] text-[10px]">// Real-time stochastic optimization execution stream...</div>
            {logs.map((log, idx) => (
              <div key={idx} className="leading-tight text-[var(--text-primary)]" dangerouslySetInnerHTML={{ __html: log }} />
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            {status === 'COMPLETED'
              ? '✨ Benchmark execution complete.'
              : status === 'FAILED' || status === 'INTERRUPTED' || status === 'CANCELLED'
              ? `⚠️ Benchmark was ${status.toLowerCase()}.`
              : '⚡ Evaluating multi-objective candidates under identical constraints...'}
          </span>

          {status === 'COMPLETED' ? (
            <button
              onClick={() => {
                onCompleted();
              }}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-900/30"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Inspect Results Dashboard &rarr;</span>
            </button>
          ) : status === 'FAILED' || status === 'INTERRUPTED' || status === 'CANCELLED' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[var(--surface-secondary)] hover:bg-[var(--border)] text-[var(--text-primary)] font-semibold text-xs transition"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  onCompleted();
                }}
                className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:opacity-90 text-white font-semibold text-xs transition"
              >
                Go to History &amp; Re-run
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    await api.cancelExperiment(experimentId);
                  } catch (e) {
                    console.error('Cancel failed', e);
                  }
                }}
                className="px-3 py-1.5 text-xs text-[var(--danger)] hover:bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded transition"
              >
                Cancel Run
              </button>
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 ws-button-secondary text-xs"
              >
                Run in Background
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
