import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2, AlertCircle, Sparkles, X } from 'lucide-react';
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
                `[BENCHMARK COMPLETED] Winner: ${exp.best_algorithm || 'Optimal'}. All metrics calculated.`,
                ...prev.slice(0, 30),
              ]);
              if (pollInterval) clearInterval(pollInterval);
            } else if (exp.status === 'FAILED') {
              setStatus('FAILED');
              setLogs((prev) => [`[ERROR] Benchmark execution failed: ${exp.error_message || 'Unknown error'}`, ...prev]);
              if (pollInterval) clearInterval(pollInterval);
            } else if (details.runs && details.runs.length > 0) {
              const completedCount = details.runs.length;
              const expectedTotal = (exp.selected_algorithms?.length || 10) * exp.number_of_runs;
              const pct = Math.min(95, Math.round((completedCount / (expectedTotal || 1)) * 100));
              setProgressPct(pct);
              const lastRun = details.runs[details.runs.length - 1];
              setCurrentAlgorithm(lastRun.algorithm);
              setCurrentRunIndex(lastRun.run_index);
            }
          }
        } catch (e) {
          // ignore poll errors
        }
      }, 1500);
    };

    const ws = api.createProgressWebSocket(experimentId, (data) => {
      if (!isSubscribed) return;
      if (data.event === 'RUN_START') {
        setCurrentAlgorithm(data.algorithm);
        setCurrentRunIndex(data.run_index);
        setTotalRuns(data.total_runs);
        setProgressPct(data.progress_pct);
        setLogs((prev) => [`[RUN START] Algorithm ${data.algorithm} &bull; Run #${data.run_index}/${data.total_runs}`, ...prev.slice(0, 30)]);
      } else if (data.event === 'RUN_COMPLETED') {
        setProgressPct(data.progress_pct);
        setLogs((prev) => [
          `[EVAL COMPLETED] ${data.algorithm} Run #${data.run_index} &rarr; Acc: ${data.run_data.accuracy?.toFixed(2)}%, Lat: ${data.run_data.latency_ms?.toFixed(2)}ms, Score: ${data.run_data.overall_score?.toFixed(1)}`,
          ...prev.slice(0, 30),
        ]);
      } else if (data.event === 'BENCHMARK_COMPLETED') {
        setProgressPct(100);
        setStatus('COMPLETED');
        setIsDone(true);
        setLogs((prev) => [`[BENCHMARK FINISHED] Winner: ${data.best_algorithm}. Computing Pareto frontiers & statistics.`, ...prev]);
        if (pollInterval) clearInterval(pollInterval);
      } else if (data.event === 'BENCHMARK_FAILED') {
        setStatus('FAILED');
        setLogs((prev) => [`[ERROR] Benchmark execution failed: ${data.error}`, ...prev]);
        if (pollInterval) clearInterval(pollInterval);
      }
    });

    startPolling();

    return () => {
      isSubscribed = false;
      if (pollInterval) clearInterval(pollInterval);
      try {
        ws.close();
      } catch (e) {}
    };
  }, [experimentId]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="lab-card w-full max-w-xl p-6 bg-slate-900 border-blue-500/70 shadow-2xl space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-sans">
          <div className="flex items-center gap-2">
            <Activity className={`w-5 h-5 ${isDone ? 'text-emerald-400' : 'text-blue-400 animate-spin'}`} />
            <h3 className="text-base font-bold text-slate-100">
              {isDone ? 'BENCHMARK COMPLETE' : 'BENCHMARK IN PROGRESS...'}
            </h3>
          </div>
          {isDone && (
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-slate-300 font-mono text-xs">
            <span>Current: <strong className="text-blue-400">{currentAlgorithm}</strong> (Run #{currentRunIndex}/{totalRuns})</span>
            <span className="font-bold text-emerald-400">{progressPct.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-emerald-400 h-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Live Event Stream Log Window */}
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/90 h-48 overflow-y-auto space-y-1 font-mono text-[11px] text-slate-300">
          <div className="text-slate-500">// Real-time PyTorch execution and optimizer stream...</div>
          {logs.map((log, idx) => (
            <div key={idx} className="leading-tight text-slate-300" dangerouslySetInnerHTML={{ __html: log }} />
          ))}
        </div>

        {/* Action button */}
        <div className="flex justify-end pt-2">
          {isDone ? (
            <button
              onClick={onClose}
              className="px-5 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-sans transition"
            >
              Open Results Dashboard &rarr;
            </button>
          ) : (
            <span className="text-slate-500 text-[11px] italic">
              Evaluating candidate solutions under identical hardware conditions...
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
