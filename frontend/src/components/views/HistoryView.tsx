import React, { useState } from 'react';
import {
  Search,
  Database,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  Cpu,
  BarChart3,
  Sparkles,
  Calendar,
  Trash2,
  Play,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { Experiment } from '../../types';

interface HistoryViewProps {
  experiments: Experiment[];
  activeExperimentId?: string;
  onSelectExperiment: (expId: string) => void;
  onNewBenchmark: () => void;
  onOpenLiveRun?: (expId: string) => void;
  onCancelExperiment?: (expId: string) => Promise<void>;
  onDeleteExperiment?: (expId: string) => Promise<void>;
  onRunExperiment?: (expId: string) => Promise<void>;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  experiments,
  activeExperimentId,
  onSelectExperiment,
  onNewBenchmark,
  onOpenLiveRun,
  onCancelExperiment,
  onDeleteExperiment,
  onRunExperiment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'RUNNING' | 'INTERRUPTED_CANCELLED'>('ALL');
  const [selectedDataset, setSelectedDataset] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'title_asc' | 'title_desc' | 'status'>('date_desc');
  const [busyExpId, setBusyExpId] = useState<string | null>(null);

  // Unique datasets for filter
  const uniqueDatasets = Array.from(new Set(experiments.map((e) => e.dataset_name).filter(Boolean)));

  const handleAction = async (e: React.MouseEvent, action: () => Promise<void>, expId: string) => {
    e.stopPropagation();
    try {
      setBusyExpId(expId);
      await action();
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setBusyExpId(null);
    }
  };

  // Filter & Sort experiments
  const filteredExperiments = experiments
    .filter((exp) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        exp.id.toLowerCase().includes(query) ||
        exp.title.toLowerCase().includes(query) ||
        exp.dataset_name.toLowerCase().includes(query) ||
        exp.cnn_model_name.toLowerCase().includes(query) ||
        (exp.best_algorithm && exp.best_algorithm.toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'COMPLETED' && exp.status === 'COMPLETED') ||
        (statusFilter === 'RUNNING' && (exp.status === 'RUNNING' || exp.status === 'QUEUED')) ||
        (statusFilter === 'INTERRUPTED_CANCELLED' && ['INTERRUPTED', 'CANCELLED', 'FAILED'].includes(exp.status));

      const matchesDataset = selectedDataset === 'ALL' || exp.dataset_name === selectedDataset;

      return matchesQuery && matchesStatus && matchesDataset;
    })
    .sort((a, b) => {
      if (sortBy === 'date_desc') {
        return (b.created_at || b.id).localeCompare(a.created_at || a.id);
      }
      if (sortBy === 'date_asc') {
        return (a.created_at || a.id).localeCompare(b.created_at || b.id);
      }
      if (sortBy === 'title_asc') {
        return (a.title || a.id).localeCompare(b.title || b.id);
      }
      if (sortBy === 'title_desc') {
        return (b.title || b.id).localeCompare(a.title || a.id);
      }
      if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Stats Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="ws-page-title">Experiment Archive &amp; Data Explorer</h2>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
              {experiments.length} Experiments in Database
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Search, filter, re-run, manage, and inspect all persistent benchmark runs and research results.
          </p>
        </div>

        <button
          onClick={onNewBenchmark}
          className="flex items-center gap-1.5 px-3 py-1.5 ws-button-primary text-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Benchmark Run</span>
        </button>
      </div>

      {/* Interactive Search & Filter Toolbar */}
      <div className="ws-panel p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Real-time Search Input */}
          <div className="flex-1 min-w-[260px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type experiment name, ID, dataset, or CNN model (e.g. ResNet-18, CIFAR-10, GWO)..."
              className="w-full pl-9 pr-4 py-2 ws-input text-xs font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] font-mono"
              >
                Clear
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-[var(--surface-secondary)] p-1 rounded-md border border-[var(--border)] text-xs font-mono">
            {[
              { id: 'ALL', label: 'ALL' },
              { id: 'COMPLETED', label: 'COMPLETED' },
              { id: 'RUNNING', label: 'RUNNING' },
              { id: 'INTERRUPTED_CANCELLED', label: 'OTHER' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id as any)}
                className={`px-2.5 py-1 rounded text-xs transition ${
                  statusFilter === st.id
                    ? 'bg-[var(--accent)] text-white font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Dataset Selector */}
          {uniqueDatasets.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-[var(--text-muted)] text-[11px]">Dataset:</span>
              <select
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
                className="ws-input px-2.5 py-1 text-xs font-mono"
              >
                <option value="ALL">All Datasets</option>
                {uniqueDatasets.map((ds) => (
                  <option key={ds} value={ds}>
                    {ds}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-[var(--text-muted)] text-[11px]">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="ws-input px-2.5 py-1 text-xs font-mono"
            >
              <option value="date_desc">Date: Newest First</option>
              <option value="date_asc">Date: Oldest First</option>
              <option value="title_asc">Name: A &rarr; Z</option>
              <option value="title_desc">Name: Z &rarr; A</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {/* Results Counter & Search Status */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] pt-1 border-t border-[var(--border)]">
          <span>
            Showing <strong>{filteredExperiments.length}</strong> of <strong>{experiments.length}</strong> experiments
          </span>
          {searchQuery && (
            <span className="text-[var(--accent)]">
              Filtering by: "{searchQuery}"
            </span>
          )}
        </div>
      </div>

      {/* Experiments Grid / Matrix Table */}
      <div className="ws-panel p-5 space-y-4">
        <div className="overflow-x-auto">
          <table className="ws-table font-mono text-xs">
            <thead>
              <tr>
                <th>Experiment ID</th>
                <th>Title / Designation</th>
                <th>Dataset &bull; Architecture</th>
                <th>Compression Specs</th>
                <th>Status</th>
                <th>Winner (Rank #1)</th>
                <th>Created At</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExperiments.map((exp) => {
                const isActive = exp.id === activeExperimentId;
                const isRunning = exp.status === 'RUNNING' || exp.status === 'QUEUED';
                const isInterrupted = ['INTERRUPTED', 'CANCELLED', 'FAILED'].includes(exp.status);
                const isBusy = busyExpId === exp.id;

                return (
                  <tr
                    key={exp.id}
                    className={`transition-colors cursor-pointer ${
                      isActive ? 'bg-[var(--surface-elevated)] border-l-2 border-[var(--accent)]' : ''
                    }`}
                    onClick={() => {
                      if (isRunning && onOpenLiveRun) {
                        onOpenLiveRun(exp.id);
                      } else {
                        onSelectExperiment(exp.id);
                      }
                    }}
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--accent)]">{exp.id}</span>
                        {isActive && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30 font-semibold">
                            ACTIVE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="font-sans text-[var(--text-primary)] font-medium max-w-[200px] truncate">
                      {exp.title}
                    </td>
                    <td className="text-[var(--text-secondary)]">
                      {exp.dataset_name} &bull; <strong className="text-[var(--text-primary)]">{exp.cnn_model_name}</strong>
                    </td>
                    <td className="text-[11px] text-[var(--text-muted)]">
                      {exp.quantization_type} &bull; {(exp.pruning_ratio * 100).toFixed(0)}% Pruned &bull; {exp.number_of_runs} Runs
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          exp.status === 'COMPLETED'
                            ? 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/30'
                            : isRunning
                            ? 'bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/30'
                            : isInterrupted
                            ? 'bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/30'
                            : 'bg-[var(--surface-secondary)] text-[var(--text-muted)]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            exp.status === 'COMPLETED'
                              ? 'bg-[var(--success)]'
                              : isRunning
                              ? 'bg-[var(--warning)] animate-pulse'
                              : isInterrupted
                              ? 'bg-[var(--danger)]'
                              : 'bg-[var(--text-muted)]'
                          }`}
                        />
                        <span>{exp.status}</span>
                      </span>
                    </td>
                    <td>
                      {exp.best_algorithm ? (
                        <span className="font-bold text-[var(--text-primary)] font-sans flex items-center gap-1">
                          <span className="text-[var(--accent)]">★</span>
                          <span>{exp.best_algorithm}</span>
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)]">--</span>
                      )}
                    </td>
                    <td className="text-[var(--text-muted)] text-[11px]">
                      {exp.created_at ? exp.created_at.slice(0, 19).replace('T', ' ') : 'Recent'}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {/* If Running: Live View or Cancel */}
                        {isRunning && (
                          <>
                            {onOpenLiveRun && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenLiveRun(exp.id);
                                }}
                                className="flex items-center gap-1 px-2 py-1 ws-button-primary text-xs font-sans"
                                title="View Live Run Progress"
                              >
                                <Clock className="w-3 h-3 animate-spin" />
                                <span>Live</span>
                              </button>
                            )}
                            {onCancelExperiment && (
                              <button
                                disabled={isBusy}
                                onClick={(e) => handleAction(e, () => onCancelExperiment(exp.id), exp.id)}
                                className="p-1 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded transition"
                                title="Cancel Benchmark Run"
                              >
                                {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </>
                        )}

                        {/* If Completed: Open Analysis */}
                        {exp.status === 'COMPLETED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectExperiment(exp.id);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 ws-button-secondary text-xs font-sans"
                          >
                            <span>Open Analysis</span>
                            <ArrowRight className="w-3 h-3 text-[var(--accent)]" />
                          </button>
                        )}

                        {/* If Interrupted or Cancelled: Re-run */}
                        {isInterrupted && onRunExperiment && (
                          <button
                            disabled={isBusy}
                            onClick={(e) => handleAction(e, () => onRunExperiment(exp.id), exp.id)}
                            className="flex items-center gap-1 px-2 py-1 bg-[var(--warning)]/10 text-[var(--warning)] hover:bg-[var(--warning)]/20 border border-[var(--warning)]/30 rounded text-xs font-sans"
                            title="Re-run Benchmark"
                          >
                            {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                            <span>Re-run</span>
                          </button>
                        )}

                        {/* Delete Experiment */}
                        {onDeleteExperiment && (
                          <button
                            disabled={isBusy}
                            onClick={(e) => {
                              if (window.confirm(`Are you sure you want to delete benchmark ${exp.id}?`)) {
                                handleAction(e, () => onDeleteExperiment(exp.id), exp.id);
                              }
                            }}
                            className="p-1 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded transition ml-1"
                            title={`Delete benchmark ${exp.id}`}
                          >
                            {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredExperiments.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-[var(--text-muted)] font-sans">
                    <div className="space-y-2">
                      <p className="text-sm">No experiments matching your search query "{searchQuery}".</p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('ALL');
                          setSelectedDataset('ALL');
                        }}
                        className="text-xs text-[var(--accent)] hover:underline font-mono"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
