import React, { useState, useEffect, useMemo } from 'react';
import {
  Download,
  FileJson,
  Layers,
  Sparkles,
  GitCompare,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Search,
  ArrowRight,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';
import {
  Experiment,
  ConfusionMatrixResponse,
} from '../../types';
import { api } from '../../services/api';
import { ConfusionMatrixHeatmap } from '../charts/ConfusionMatrixHeatmap';

interface ConfusionMatrixViewProps {
  experiment: Experiment;
  initialAlgorithm?: string;
}

export const ConfusionMatrixView: React.FC<ConfusionMatrixViewProps> = ({
  experiment,
  initialAlgorithm,
}) => {
  const [data, setData] = useState<ConfusionMatrixResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Controls State
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>(
    initialAlgorithm || experiment.best_algorithm || experiment.selected_algorithms?.[0] || 'GWO'
  );
  const [compareAlgorithm, setCompareAlgorithm] = useState<string>(
    experiment.selected_algorithms?.find((a) => a !== selectedAlgorithm) || ''
  );
  const [selectedRunIndex, setSelectedRunIndex] = useState<number | undefined>(undefined);
  const [isNormalized, setIsNormalized] = useState<boolean>(true);
  const [displayMode, setDisplayMode] = useState<
    'OPTIMIZED' | 'BASELINE' | 'DELTA_BASELINE' | 'DELTA_ALGORITHM'
  >('OPTIMIZED');

  // Interactive Analysis State
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [tableSearch, setTableSearch] = useState<string>('');
  const [tableSortKey, setTableSortKey] = useState<string>('recall_drop_pp');
  const [tableSortAsc, setTableSortAsc] = useState<boolean>(false);
  const [isSymmetricPairs, setIsSymmetricPairs] = useState<boolean>(false);

  // Load Confusion Matrix Data
  const loadConfusionMatrix = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const comparisonMode = displayMode === 'DELTA_ALGORITHM' ? 'ALGORITHM' : 'BASELINE';

      const res = await api.getConfusionMatrix(experiment.id, {
        algorithm: selectedAlgorithm,
        compare_algorithm: displayMode === 'DELTA_ALGORITHM' ? compareAlgorithm : undefined,
        run_index: selectedRunIndex,
        normalized: isNormalized,
        comparison: comparisonMode,
      });

      setData(res);
      // Auto-select first class if none selected
      if (!selectedClass && res.evaluation.classes.length > 0) {
        setSelectedClass(res.evaluation.classes[0]);
      }
    } catch (err: any) {
      console.error('Failed to load confusion matrix:', err);
      setError(err?.message || 'Failed to load confusion matrix data from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfusionMatrix();
  }, [experiment.id, selectedAlgorithm, compareAlgorithm, selectedRunIndex, displayMode]);

  // Export handlers
  const handleExportCSV = () => {
    if (!data) return;
    const { classes, raw_matrix, normalized_matrix, per_class_metrics, provenance } = data.evaluation;
    
    let csv = `# CNN Benchmark Confusion Matrix\n`;
    csv += `# Experiment: ${data.experiment_id} - ${data.experiment_title}\n`;
    csv += `# Algorithm: ${data.selected_algorithm} (Run #${data.selected_run_index})\n`;
    csv += `# Mode: ${provenance.mode} (${provenance.provenance})\n`;
    csv += `# Accuracy: ${data.evaluation.global_metrics.accuracy}%\n\n`;

    csv += `## RAW COUNTS MATRIX\n`;
    csv += `True \\ Predicted,${classes.join(',')}\n`;
    raw_matrix.forEach((row, i) => {
      csv += `${classes[i]},${row.join(',')}\n`;
    });

    csv += `\n## ROW-NORMALIZED MATRIX (%)\n`;
    csv += `True \\ Predicted,${classes.join(',')}\n`;
    normalized_matrix.forEach((row, i) => {
      csv += `${classes[i]},${row.map((v) => v.toFixed(2)).join(',')}\n`;
    });

    csv += `\n## PER-CLASS METRICS\n`;
    csv += `Class,Support,Precision(%),Recall(%),F1(%),Baseline Recall(%),Recall Drop(pp)\n`;
    per_class_metrics.forEach((m) => {
      csv += `${m.class_name},${m.support},${m.precision.toFixed(2)},${m.recall.toFixed(2)},${m.f1_score.toFixed(2)},${m.baseline_recall ?? ''},${m.recall_drop_pp ?? ''}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `confusion_matrix_${data.experiment_id}_${data.selected_algorithm}_run${data.selected_run_index}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `confusion_matrix_${data.experiment_id}_${data.selected_algorithm}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Sort and filter per-class metrics
  const filteredMetrics = useMemo(() => {
    if (!data?.evaluation.per_class_metrics) return [];
    let list = [...data.evaluation.per_class_metrics];

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      list = list.filter(
        (m) =>
          m.class_name.toLowerCase().includes(q) ||
          m.semantic_group?.toLowerCase().includes(q)
      );
    }

    list.sort((a: any, b: any) => {
      let valA = a[tableSortKey] ?? -9999;
      let valB = b[tableSortKey] ?? -9999;
      if (typeof valA === 'string') {
        return tableSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return tableSortAsc ? valA - valB : valB - valA;
    });

    return list;
  }, [data, tableSearch, tableSortKey, tableSortAsc]);

  // Selected class error breakdown
  const selectedClassDetails = useMemo(() => {
    if (!data || !selectedClass) return null;
    const classIdx = data.evaluation.classes.indexOf(selectedClass);
    if (classIdx === -1) return null;

    const metric = data.evaluation.per_class_metrics[classIdx];
    const rawRow = data.evaluation.raw_matrix[classIdx];
    const normRow = data.evaluation.normalized_matrix[classIdx];

    const misclassifications: Array<{
      targetClass: string;
      targetIndex: number;
      count: number;
      pct: number;
    }> = [];

    rawRow.forEach((cnt, idx) => {
      if (idx !== classIdx && cnt > 0) {
        misclassifications.push({
          targetClass: data.evaluation.classes[idx],
          targetIndex: idx,
          count: cnt,
          pct: normRow[idx],
        });
      }
    });

    misclassifications.sort((a, b) => b.count - a.count);

    return {
      metric,
      classIdx,
      misclassifications,
    };
  }, [data, selectedClass]);

  const handleTableSort = (key: string) => {
    if (tableSortKey === key) {
      setTableSortAsc(!tableSortAsc);
    } else {
      setTableSortKey(key);
      setTableSortAsc(false);
    }
  };

  const isSimulated = data?.evaluation.provenance.mode === 'SIMULATION';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-[var(--surface-primary)] border border-[var(--border)] rounded-xl shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[var(--text-primary)] font-mono flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[var(--accent)]" />
              Confusion Matrix & Degradation Suite
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-secondary)]">
              {experiment.dataset_name} &bull; {experiment.cnn_model_name}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Analyze class-level decision boundaries, asymmetric compression degradation, and systematic misclassification clusters under pruning & quantization.
          </p>
        </div>

        {/* Provenance Badge & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {data && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono border ${
                isSimulated
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                {isSimulated ? 'SIMULATED (Calibrated Model)' : 'REAL (Actual Predictions)'}
              </span>
            </div>
          )}

          <button
            onClick={handleExportCSV}
            disabled={!data}
            className="px-3 py-1.5 bg-[var(--surface-secondary)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] rounded-md text-xs font-mono flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>

          <button
            onClick={handleExportJSON}
            disabled={!data}
            className="px-3 py-1.5 bg-[var(--surface-secondary)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] rounded-md text-xs font-mono flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer disabled:opacity-50"
          >
            <FileJson className="w-3.5 h-3.5" /> JSON
          </button>
        </div>
      </div>

      {/* Control Strip */}
      <div className="p-4 bg-[var(--surface-primary)] border border-[var(--border)] rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Left: Algorithm & Run Selectors */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Primary Algorithm */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--text-muted)]">Algorithm:</span>
            <select
              value={selectedAlgorithm}
              onChange={(e) => setSelectedAlgorithm(e.target.value)}
              className="px-3 py-1.5 text-xs font-mono bg-[var(--surface-secondary)] border border-[var(--border)] rounded-md text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--accent)] cursor-pointer"
            >
              {data?.available_algorithms.map((alg) => (
                <option key={alg} value={alg}>
                  {alg}
                </option>
              ))}
            </select>
          </div>

          {/* Run Index */}
          {data?.algorithm_runs_map[selectedAlgorithm] && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[var(--text-muted)]">Run:</span>
              <select
                value={selectedRunIndex !== undefined ? selectedRunIndex : ''}
                onChange={(e) =>
                  setSelectedRunIndex(
                    e.target.value === '' ? undefined : Number(e.target.value)
                  )
                }
                className="px-3 py-1.5 text-xs font-mono bg-[var(--surface-secondary)] border border-[var(--border)] rounded-md text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--accent)] cursor-pointer"
              >
                <option value="">Best Run (Highest Acc)</option>
                {data.algorithm_runs_map[selectedAlgorithm].map((r) => (
                  <option key={r} value={r}>
                    Run #{r}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Algorithm Comparison Picker (if in DELTA_ALGORITHM mode) */}
          {displayMode === 'DELTA_ALGORITHM' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[var(--text-muted)]">Compare with:</span>
              <select
                value={compareAlgorithm}
                onChange={(e) => setCompareAlgorithm(e.target.value)}
                className="px-3 py-1.5 text-xs font-mono bg-[var(--surface-secondary)] border border-[var(--border)] rounded-md text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--accent)] cursor-pointer"
              >
                {data?.available_algorithms
                  .filter((a) => a !== selectedAlgorithm)
                  .map((alg) => (
                    <option key={alg} value={alg}>
                      {alg}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Right: View Mode & Normalized Toggle */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Mode Tabs */}
          <div className="flex items-center bg-[var(--surface-secondary)] border border-[var(--border)] rounded-lg p-0.5">
            <button
              onClick={() => setDisplayMode('OPTIMIZED')}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                displayMode === 'OPTIMIZED'
                  ? 'bg-[var(--accent)] text-white shadow-xs font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Optimized
            </button>
            <button
              onClick={() => setDisplayMode('BASELINE')}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                displayMode === 'BASELINE'
                  ? 'bg-[var(--accent)] text-white shadow-xs font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Baseline
            </button>
            <button
              onClick={() => setDisplayMode('DELTA_BASELINE')}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                displayMode === 'DELTA_BASELINE'
                  ? 'bg-amber-600 text-white shadow-xs font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Δ Baseline
            </button>
            {data?.available_algorithms && data.available_algorithms.length > 1 && (
              <button
                onClick={() => setDisplayMode('DELTA_ALGORITHM')}
                className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                  displayMode === 'DELTA_ALGORITHM'
                    ? 'bg-purple-600 text-white shadow-xs font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Δ Alg vs Alg
              </button>
            )}
          </div>

          {/* Normalized Toggle */}
          <div className="flex items-center bg-[var(--surface-secondary)] border border-[var(--border)] rounded-lg p-0.5">
            <button
              onClick={() => setIsNormalized(true)}
              className={`px-2.5 py-1 text-xs font-mono rounded-md transition-all ${
                isNormalized
                  ? 'bg-[var(--surface-elevated)] text-[var(--accent)] font-bold shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Normalized (%)
            </button>
            <button
              onClick={() => setIsNormalized(false)}
              className={`px-2.5 py-1 text-xs font-mono rounded-md transition-all ${
                !isNormalized
                  ? 'bg-[var(--surface-elevated)] text-[var(--accent)] font-bold shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Raw Counts
            </button>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="p-12 text-center bg-[var(--surface-primary)] border border-[var(--border)] rounded-xl">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[var(--accent)] mb-3" />
          <p className="text-sm font-mono text-[var(--text-secondary)]">
            Computing high-precision confusion matrix & degradation metrics...
          </p>
        </div>
      )}

      {error && (
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-mono flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm mb-1">Evaluation Error</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && !error && data && (
        <>
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Top-1 Accuracy */}
            <div className="p-4 bg-[var(--surface-primary)] border border-[var(--border)] rounded-xl shadow-xs">
              <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-1">
                Top-1 Accuracy
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[var(--text-primary)] font-mono">
                  {data.evaluation.global_metrics.accuracy.toFixed(2)}%
                </span>
                <span
                  className={`text-xs font-mono font-bold ${
                    data.accuracy_drop > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {data.accuracy_drop > 0 ? `-${data.accuracy_drop.toFixed(2)} pp` : '+0.00 pp'}
                </span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-1 font-mono">
                Baseline: {data.baseline_accuracy.toFixed(2)}% &bull; {data.evaluation.global_metrics.total_correct.toLocaleString()} / {data.evaluation.global_metrics.total_samples.toLocaleString()}
              </div>
            </div>

            {/* Macro F1 Score */}
            <div className="p-4 bg-[var(--surface-primary)] border border-[var(--border)] rounded-xl shadow-xs">
              <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-1">
                Macro F1-Score
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-indigo-400 font-mono">
                  {data.evaluation.global_metrics.macro_f1.toFixed(2)}%
                </span>
                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                  W-F1: {data.evaluation.global_metrics.weighted_f1.toFixed(2)}%
                </span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-1 font-mono">
                Prec: {data.evaluation.global_metrics.macro_precision.toFixed(1)}% &bull; Rec: {data.evaluation.global_metrics.macro_recall.toFixed(1)}%
              </div>
            </div>

            {/* Worst Degraded Class */}
            <div className="p-4 bg-[var(--surface-primary)] border border-[var(--border)] rounded-xl shadow-xs">
              <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-1">
                Most Degraded Class
              </div>
              {data.evaluation.degraded_classes && data.evaluation.degraded_classes.length > 0 ? (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-rose-400 font-mono truncate max-w-[140px]">
                      {data.evaluation.degraded_classes[0].class_name}
                    </span>
                    <span className="text-xs font-mono font-bold text-rose-400">
                      -{data.evaluation.degraded_classes[0].recall_drop_pp?.toFixed(1)} pp
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-1 font-mono">
                    Recall: {data.evaluation.degraded_classes[0].recall.toFixed(1)}% (was {data.evaluation.degraded_classes[0].baseline_recall?.toFixed(1)}%)
                  </div>
                </div>
              ) : (
                <div className="text-xs text-[var(--text-muted)] font-mono mt-2">No degradation detected</div>
              )}
            </div>

            {/* Most Confused Pair */}
            <div className="p-4 bg-[var(--surface-primary)] border border-[var(--border)] rounded-xl shadow-xs">
              <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-1">
                Top Confused Pair
              </div>
              {data.evaluation.top_confused_pairs && data.evaluation.top_confused_pairs.length > 0 ? (
                <div>
                  <div className="text-xs font-bold text-[var(--text-primary)] font-mono flex items-center gap-1.5 truncate">
                    <span className="text-blue-400">{data.evaluation.top_confused_pairs[0].true_class}</span>
                    <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
                    <span className="text-pink-400">{data.evaluation.top_confused_pairs[0].predicted_class}</span>
                  </div>
                  <div className="text-xs font-mono text-[var(--accent)] mt-1 font-bold">
                    {data.evaluation.top_confused_pairs[0].count} samples ({data.evaluation.top_confused_pairs[0].percentage_of_true_class.toFixed(1)}%)
                  </div>
                </div>
              ) : (
                <div className="text-xs text-[var(--text-muted)] font-mono mt-2">Perfect accuracy on test split</div>
              )}
            </div>
          </div>

          {/* Main Heatmap Visualizer */}
          <ConfusionMatrixHeatmap
            evaluation={data.evaluation}
            algorithmComparison={data.algorithm_comparison}
            displayMode={displayMode}
            isNormalized={isNormalized}
            onSelectClass={(cls) => setSelectedClass(cls)}
            selectedClass={selectedClass}
          />

          {/* Grid Layout: Top Confusions + Selected Class Decomposition */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Confusions Ranking */}
            <div className="p-5 bg-[var(--surface-primary)] border border-[var(--border)] rounded-xl shadow-xs flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--text-primary)] font-mono">
                    TOP MISCLASSIFICATION PAIRS
                  </span>
                </div>
                <div className="flex items-center bg-[var(--surface-secondary)] border border-[var(--border)] rounded-md p-0.5 text-[11px] font-mono">
                  <button
                    onClick={() => setIsSymmetricPairs(false)}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      !isSymmetricPairs
                        ? 'bg-[var(--accent)] text-white font-bold'
                        : 'text-[var(--text-muted)]'
                    }`}
                  >
                    Directional (A&rarr;B)
                  </button>
                  <button
                    onClick={() => setIsSymmetricPairs(true)}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      isSymmetricPairs
                        ? 'bg-[var(--accent)] text-white font-bold'
                        : 'text-[var(--text-muted)]'
                    }`}
                  >
                    Mutual (A&harr;B)
                  </button>
                </div>
              </div>

              {/* Pair List */}
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[340px] pr-1">
                {!isSymmetricPairs ? (
                  data.evaluation.top_confused_pairs.slice(0, 8).map((pair, idx) => {
                    const pct = pair.percentage_of_true_class;
                    return (
                      <div
                        key={`pair-${idx}`}
                        onClick={() => setSelectedClass(pair.true_class)}
                        className="p-2.5 bg-[var(--surface-secondary)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-xs font-mono flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-slate-900 border border-[var(--border)] flex items-center justify-center text-[10px] text-[var(--text-muted)]">
                            #{idx + 1}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-blue-400">{pair.true_class}</span>
                            <span className="text-[var(--text-muted)]">&rarr;</span>
                            <span className="font-bold text-pink-400">{pair.predicted_class}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className="bg-pink-500 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, pct * 4)}%` }}
                            />
                          </div>
                          <span className="font-bold text-white min-w-[50px] text-right">
                            {pair.count} <span className="text-[10px] text-[var(--text-muted)]">({pct.toFixed(1)}%)</span>
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  data.evaluation.top_symmetric_pairs.slice(0, 8).map((symPair, idx) => (
                    <div
                      key={`sym-${idx}`}
                      onClick={() => setSelectedClass(symPair.class_a)}
                      className="p-2.5 bg-[var(--surface-secondary)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-xs font-mono flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-900 border border-[var(--border)] flex items-center justify-center text-[10px] text-[var(--text-muted)]">
                          #{idx + 1}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-blue-400">{symPair.class_a}</span>
                          <span className="text-amber-400">&harr;</span>
                          <span className="font-bold text-indigo-400">{symPair.class_b}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {symPair.a_to_b_count} &bull; {symPair.b_to_a_count}
                        </span>
                        <span className="font-bold text-amber-400 min-w-[60px] text-right">
                          {symPair.total_mutual_confusion} total
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Class Error Flow Breakdown */}
            <div className="p-5 bg-[var(--surface-primary)] border border-[var(--border)] rounded-xl shadow-xs flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--text-primary)] font-mono">
                    ERROR DECOMPOSITION
                  </span>
                  {selectedClass && (
                    <span className="text-xs px-2 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--accent)] font-mono border border-[var(--border)] font-bold">
                      Class: {selectedClass}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                  Click any class in matrix/table to focus
                </span>
              </div>

              {selectedClassDetails ? (
                <div className="space-y-4 flex-1">
                  {/* Selected Class Header Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                    <div className="p-2 bg-[var(--surface-secondary)] rounded-lg border border-[var(--border)]">
                      <div className="text-[10px] text-[var(--text-muted)]">Recall</div>
                      <div className="font-bold text-blue-400 text-sm">
                        {selectedClassDetails.metric.recall.toFixed(1)}%
                      </div>
                    </div>
                    <div className="p-2 bg-[var(--surface-secondary)] rounded-lg border border-[var(--border)]">
                      <div className="text-[10px] text-[var(--text-muted)]">Precision</div>
                      <div className="font-bold text-indigo-400 text-sm">
                        {selectedClassDetails.metric.precision.toFixed(1)}%
                      </div>
                    </div>
                    <div className="p-2 bg-[var(--surface-secondary)] rounded-lg border border-[var(--border)]">
                      <div className="text-[10px] text-[var(--text-muted)]">Recall Drop</div>
                      <div
                        className={`font-bold text-sm ${
                          (selectedClassDetails.metric.recall_drop_pp ?? 0) > 0
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {(selectedClassDetails.metric.recall_drop_pp ?? 0) > 0
                          ? `-${selectedClassDetails.metric.recall_drop_pp?.toFixed(1)} pp`
                          : '+0.0 pp'}
                      </div>
                    </div>
                  </div>

                  {/* Flow Distribution Tree */}
                  <div className="space-y-2 max-h-[230px] overflow-y-auto pr-1">
                    <div className="text-[11px] font-mono text-[var(--text-muted)]">
                      Where lost accuracy goes (Confusion Distribution):
                    </div>
                    {selectedClassDetails.misclassifications.length > 0 ? (
                      selectedClassDetails.misclassifications.map((m, i) => (
                        <div
                          key={`flow-${i}`}
                          className="p-2 bg-[var(--surface-secondary)] rounded border border-[var(--border)] text-xs font-mono flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--text-muted)]">&rarr; Misclassified as</span>
                            <span className="font-bold text-pink-400">{m.targetClass}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{m.count}</span>
                            <span className="text-[10px] text-[var(--text-muted)]">
                              ({m.pct.toFixed(1)}% of class)
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-emerald-400 font-mono bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        100% correct classification! Zero misclassifications for this class.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-[var(--text-muted)] font-mono">
                  Select a class from the heatmap to view its error distribution.
                </div>
              )}
            </div>
          </div>

          {/* Full Per-Class Degradation Breakdown Table */}
          <div className="p-5 bg-[var(--surface-primary)] border border-[var(--border)] rounded-xl shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border)] mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[var(--text-primary)] font-mono">
                  PER-CLASS METRICS & DEGRADATION BREAKDOWN
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-secondary)] text-[var(--text-muted)] font-mono">
                  {filteredMetrics.length} of {data.evaluation.classes_count} Classes
                </span>
              </div>

              {/* Table Search Filter */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Filter class table..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-[var(--surface-secondary)] border border-[var(--border)] rounded-md text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--accent)] font-mono w-48 transition-all"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-[11px]">
                    <th
                      onClick={() => handleTableSort('class_name')}
                      className="py-2.5 px-3 cursor-pointer hover:text-[var(--text-primary)] select-none"
                    >
                      Class Name
                    </th>
                    {data.evaluation.semantic_summary && data.evaluation.semantic_summary.length > 0 && (
                      <th className="py-2.5 px-3">Semantic Group</th>
                    )}
                    <th
                      onClick={() => handleTableSort('support')}
                      className="py-2.5 px-3 cursor-pointer hover:text-[var(--text-primary)] text-right select-none"
                    >
                      Support
                    </th>
                    <th
                      onClick={() => handleTableSort('precision')}
                      className="py-2.5 px-3 cursor-pointer hover:text-[var(--text-primary)] text-right select-none"
                    >
                      Precision
                    </th>
                    <th
                      onClick={() => handleTableSort('recall')}
                      className="py-2.5 px-3 cursor-pointer hover:text-[var(--text-primary)] text-right select-none"
                    >
                      Optimized Recall
                    </th>
                    <th
                      onClick={() => handleTableSort('baseline_recall')}
                      className="py-2.5 px-3 cursor-pointer hover:text-[var(--text-primary)] text-right select-none"
                    >
                      Baseline Recall
                    </th>
                    <th
                      onClick={() => handleTableSort('recall_drop_pp')}
                      className="py-2.5 px-3 cursor-pointer hover:text-[var(--text-primary)] text-right select-none"
                    >
                      Recall Drop (Δ pp)
                    </th>
                    <th
                      onClick={() => handleTableSort('f1_score')}
                      className="py-2.5 px-3 cursor-pointer hover:text-[var(--text-primary)] text-right select-none"
                    >
                      F1-Score
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredMetrics.map((m) => {
                    const isSelected = selectedClass === m.class_name;
                    const drop = m.recall_drop_pp ?? 0;

                    return (
                      <tr
                        key={m.class_name}
                        onClick={() => setSelectedClass(m.class_name)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-500/10 font-bold'
                            : 'hover:bg-[var(--surface-secondary)]'
                        }`}
                      >
                        <td className="py-2 px-3 text-[var(--text-primary)] flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isSelected ? 'bg-blue-400 ring-2 ring-blue-400/40' : 'bg-slate-700'
                            }`}
                          />
                          <span>{m.class_name}</span>
                        </td>
                        {data.evaluation.semantic_summary && data.evaluation.semantic_summary.length > 0 && (
                          <td className="py-2 px-3 text-[var(--text-muted)]">
                            {m.semantic_group || '-'}
                          </td>
                        )}
                        <td className="py-2 px-3 text-right text-[var(--text-secondary)]">
                          {m.support}
                        </td>
                        <td className="py-2 px-3 text-right text-indigo-400">
                          {m.precision.toFixed(1)}%
                        </td>
                        <td className="py-2 px-3 text-right text-blue-400 font-bold">
                          {m.recall.toFixed(1)}%
                        </td>
                        <td className="py-2 px-3 text-right text-[var(--text-muted)]">
                          {m.baseline_recall ? `${m.baseline_recall.toFixed(1)}%` : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-bold">
                          {m.recall_drop_pp !== null && m.recall_drop_pp !== undefined ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono ${
                                drop > 0.05
                                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                                  : drop < -0.05
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-slate-500/15 text-slate-400 border border-slate-500/20'
                              }`}
                            >
                              {drop > 0.05
                                ? `▼ Degraded (-${drop.toFixed(1)} pp)`
                                : drop < -0.05
                                ? `▲ Improved (+${Math.abs(drop).toFixed(1)} pp)`
                                : `● Unchanged (0.0 pp)`}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-2 px-3 text-right text-[var(--text-primary)] font-bold">
                          {m.f1_score.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Scientific Provenance Audit Panel */}
          <div className="p-4 bg-[var(--surface-secondary)]/50 border border-[var(--border)] rounded-xl font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)] mb-3">
              <span className="text-[var(--text-primary)] font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                SCIENTIFIC PROVENANCE & AUDIT TRAIL
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                Dual Engine Architecture Guarantee
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
              <div>
                <div className="text-[var(--text-muted)]">Execution Mode:</div>
                <div className="text-[var(--text-primary)] font-bold">{data.evaluation.provenance.mode}</div>
              </div>
              <div>
                <div className="text-[var(--text-muted)]">Prediction Source:</div>
                <div className="text-[var(--text-primary)] font-bold truncate" title={data.evaluation.provenance.prediction_source}>
                  {data.evaluation.provenance.prediction_source}
                </div>
              </div>
              <div>
                <div className="text-[var(--text-muted)]">Calibration Grounding:</div>
                <div className="text-[var(--text-primary)] truncate" title={data.evaluation.provenance.calibration}>
                  {data.evaluation.provenance.calibration || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-[var(--text-muted)]">Dataset / Classes:</div>
                <div className="text-[var(--text-primary)] font-bold">
                  {data.evaluation.dataset} ({data.evaluation.classes_count} Classes)
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
