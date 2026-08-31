import React, { useState, useMemo } from 'react';
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Info,
  HelpCircle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { ConfusionMatrixEvaluation, AlgorithmComparisonDifferential } from '../../types';

interface ConfusionMatrixHeatmapProps {
  evaluation: ConfusionMatrixEvaluation;
  algorithmComparison?: AlgorithmComparisonDifferential | null;
  displayMode: 'OPTIMIZED' | 'BASELINE' | 'DELTA_BASELINE' | 'DELTA_ALGORITHM';
  isNormalized: boolean;
  onSelectClass?: (className: string) => void;
  selectedClass?: string | null;
}

export const ConfusionMatrixHeatmap: React.FC<ConfusionMatrixHeatmapProps> = ({
  evaluation,
  algorithmComparison,
  displayMode,
  isNormalized,
  onSelectClass,
  selectedClass,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{
    row: number;
    col: number;
    val: number;
    rawVal?: number;
    normVal?: number;
    deltaVal?: number;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const classes = evaluation.classes || [];
  const K = classes.length;

  // Determine active 2D matrix data to display based on mode
  const activeMatrix = useMemo(() => {
    if (displayMode === 'DELTA_ALGORITHM' && algorithmComparison) {
      return isNormalized
        ? algorithmComparison.delta_normalized_matrix
        : algorithmComparison.delta_raw_matrix;
    }
    if (displayMode === 'DELTA_BASELINE' && evaluation.delta_normalized_matrix) {
      return isNormalized
        ? evaluation.delta_normalized_matrix
        : (evaluation.delta_raw_matrix || evaluation.delta_normalized_matrix);
    }
    if (displayMode === 'BASELINE' && evaluation.baseline_normalized_matrix) {
      return isNormalized
        ? evaluation.baseline_normalized_matrix
        : (evaluation.baseline_raw_matrix || evaluation.raw_matrix);
    }
    // Default: OPTIMIZED
    return isNormalized ? evaluation.normalized_matrix : evaluation.raw_matrix;
  }, [displayMode, isNormalized, evaluation, algorithmComparison]);

  const isDeltaMode = displayMode === 'DELTA_BASELINE' || displayMode === 'DELTA_ALGORITHM';

  // Filtered indices if user searches for a class
  const highlightedIndices = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const indices = new Set<number>();
    classes.forEach((c, idx) => {
      if (c.toLowerCase().includes(q)) {
        indices.add(idx);
      }
    });
    return indices;
  }, [searchQuery, classes]);

  // Compute color for each cell
  const getCellColor = (row: number, col: number, value: number) => {
    const isDiagonal = row === col;

    if (isDeltaMode) {
      // Diverging Delta Color Scale:
      // For diagonal (correct predictions): positive = improved (green), negative = degraded (red)
      // For off-diagonal (misclassification errors): positive = increased error (red), negative = reduced error (green)
      if (value === 0) return 'var(--surface-secondary)';

      if (isDiagonal) {
        if (value > 0) {
          const intensity = Math.min(1, Math.abs(value) / 15.0);
          return `rgba(16, 185, 129, ${0.25 + intensity * 0.65})`; // emerald
        } else {
          const intensity = Math.min(1, Math.abs(value) / 15.0);
          return `rgba(239, 68, 68, ${0.30 + intensity * 0.65})`; // rose/red
        }
      } else {
        if (value > 0) {
          // Increased confusion error
          const intensity = Math.min(1, Math.abs(value) / 8.0);
          return `rgba(244, 63, 94, ${0.25 + intensity * 0.70})`; // crimson
        } else {
          // Reduced confusion error
          const intensity = Math.min(1, Math.abs(value) / 8.0);
          return `rgba(16, 185, 129, ${0.20 + intensity * 0.60})`; // emerald
        }
      }
    }

    // Standard Non-Delta Matrix:
    // Normalized: 0 to 100%
    if (isNormalized) {
      if (isDiagonal) {
        // Diagonal: Strong Blue gradient based on accuracy
        const intensity = Math.min(1, Math.max(0.12, value / 100.0));
        return `rgba(2, 132, 199, ${0.20 + intensity * 0.75})`;
      } else {
        // Off-diagonal errors: subtle accent/pink for high confusion
        if (value <= 0.1) return 'var(--surface-secondary)';
        const intensity = Math.min(1, value / 20.0);
        return `rgba(236, 72, 153, ${0.20 + intensity * 0.75})`;
      }
    } else {
      // Raw Counts
      const maxCount = evaluation.global_metrics.total_samples / K;
      if (isDiagonal) {
        const intensity = Math.min(1, Math.max(0.12, value / (maxCount || 1000)));
        return `rgba(2, 132, 199, ${0.20 + intensity * 0.75})`;
      } else {
        if (value === 0) return 'var(--surface-secondary)';
        const intensity = Math.min(1, value / ((maxCount * 0.2) || 200));
        return `rgba(236, 72, 153, ${0.20 + intensity * 0.75})`;
      }
    }
  };

  // Determine cell sizing based on class count (e.g. 10 classes vs 100 classes)
  const cellSize = useMemo(() => {
    if (K <= 10) return Math.round(52 * zoomLevel);
    if (K <= 20) return Math.round(36 * zoomLevel);
    if (K <= 50) return Math.round(24 * zoomLevel);
    return Math.round(18 * zoomLevel);
  }, [K, zoomLevel]);

  return (
    <div
      className={`bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg flex flex-col transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 overflow-hidden bg-[var(--surface-elevated)]/98 backdrop-blur-md p-6' : 'p-5'
      }`}
    >
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border)] mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[var(--text-primary)] font-mono">
              CONFUSION MATRIX
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {K} × {K} Classes
            </span>
            {isDeltaMode && (
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                <span>Δ Differential Mode</span>
                <span className="text-[10px] text-[var(--text-muted)]">(pp)</span>
              </span>
            )}
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Class Search */}
          {K > 10 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Find class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs bg-[var(--surface-secondary)] border border-[var(--border)] rounded-md text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--accent)] font-mono w-36 transition-all"
              />
            </div>
          )}

          {/* Zoom In / Out / Reset */}
          <div className="flex items-center bg-[var(--surface-secondary)] border border-[var(--border)] rounded-md overflow-hidden p-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
              title="Zoom out"
              aria-label="Zoom out matrix"
              className="p-1 hover:bg-[var(--surface-elevated)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1.0)}
              title="Reset Zoom to 100%"
              aria-label="Reset zoom"
              className="text-[11px] font-mono px-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.2))}
              title="Zoom in"
              aria-label="Zoom in matrix"
              className="p-1 hover:bg-[var(--surface-elevated)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Matrix'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Expand Matrix'}
            className="p-1.5 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Axis & Color Interpretation Guide */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-[var(--text-muted)] mb-3 px-1 font-mono gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
          <span>
            <strong className="text-[var(--text-secondary)]">Rows:</strong> True Label (Ground Truth)
          </span>
          <span className="text-[var(--border)]">|</span>
          <span className="inline-block w-2 h-2 rounded-full bg-indigo-500" />
          <span>
            <strong className="text-[var(--text-secondary)]">Columns:</strong> Predicted Label (Model Output)
          </span>
        </div>

        {/* Dynamic Legend */}
        {isDeltaMode ? (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
              <span>Diagonal (+) Improved / Off-Diagonal (-) Reduced Error</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" />
              <span>Diagonal (-) Degraded / Off-Diagonal (+) Increased Error</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block" />
              <span>Diagonal (True Positives)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-pink-600 inline-block" />
              <span>Off-Diagonal (Misclassifications)</span>
            </div>
          </div>
        )}
      </div>

      {/* Heatmap Grid Viewport with Scrollbars */}
      <div
        role="grid"
        aria-label="Confusion Matrix Grid"
        className="relative flex-1 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)]/30 p-4 max-h-[620px]"
      >
        <div className="inline-block min-w-full">
          {/* Top Column Headers (Predicted Labels) */}
          <div className="flex ml-28 sticky top-0 bg-[var(--surface)]/95 backdrop-blur-xs z-20 pb-2 border-b border-[var(--border)]">
            <div className="flex" style={{ gap: `${Math.max(2, Math.round(2 * zoomLevel))}px` }}>
              {classes.map((className, colIdx) => {
                const isSelected = selectedClass === className;
                const isHovered = hoveredCell?.col === colIdx;
                const isHighlighted = highlightedIndices ? highlightedIndices.has(colIdx) : false;

                return (
                  <div
                    key={`col-${colIdx}`}
                    style={{ width: `${cellSize}px` }}
                    className={`flex flex-col items-center justify-end text-center transition-all ${
                      isSelected || isHovered || isHighlighted
                        ? 'text-blue-400 font-bold'
                        : 'text-[var(--text-muted)]'
                    }`}
                  >
                    <span
                      className="text-[10px] font-mono truncate max-w-full transform -rotate-45 origin-bottom-left block"
                      style={{ height: K > 15 ? '50px' : '40px' }}
                      title={`Predicted: ${className} (#${colIdx})`}
                    >
                      {K > 15 ? className.slice(0, 4) : className}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Matrix Rows */}
          <div
            className="flex flex-col mt-2"
            style={{ gap: `${Math.max(2, Math.round(2 * zoomLevel))}px` }}
          >
            {classes.map((rowName, rowIdx) => {
              const isSelected = selectedClass === rowName;
              const isRowHovered = hoveredCell?.row === rowIdx;
              const isHighlighted = highlightedIndices ? highlightedIndices.has(rowIdx) : false;

              return (
                <div key={`row-${rowIdx}`} className="flex items-center">
                  {/* Row Header (True Label) */}
                  <div
                    className={`w-28 pr-3 text-right text-xs font-mono truncate transition-colors cursor-pointer ${
                      isSelected || isRowHovered || isHighlighted
                        ? 'text-blue-400 font-bold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                    title={`True Class: ${rowName} (#${rowIdx}) - Click to focus`}
                    onClick={() => onSelectClass && onSelectClass(rowName)}
                  >
                    {rowName}
                  </div>

                  {/* Row Cells */}
                  <div
                    className="flex"
                    style={{ gap: `${Math.max(2, Math.round(2 * zoomLevel))}px` }}
                  >
                    {classes.map((colName, colIdx) => {
                      const value = activeMatrix?.[rowIdx]?.[colIdx] ?? 0;
                      const isDiagonal = rowIdx === colIdx;
                      const isHovered = hoveredCell?.row === rowIdx && hoveredCell?.col === colIdx;
                      const cellColor = getCellColor(rowIdx, colIdx, value);

                      const rawVal = evaluation.raw_matrix?.[rowIdx]?.[colIdx] ?? 0;
                      const normVal = evaluation.normalized_matrix?.[rowIdx]?.[colIdx] ?? 0;
                      const deltaVal = evaluation.delta_normalized_matrix?.[rowIdx]?.[colIdx];

                      return (
                        <div
                          key={`cell-${rowIdx}-${colIdx}`}
                          style={{
                            width: `${cellSize}px`,
                            height: `${cellSize}px`,
                            backgroundColor: cellColor,
                          }}
                          onMouseEnter={() =>
                            setHoveredCell({
                              row: rowIdx,
                              col: colIdx,
                              val: value,
                              rawVal,
                              normVal,
                              deltaVal,
                            })
                          }
                          onMouseLeave={() => setHoveredCell(null)}
                          onClick={() => onSelectClass && onSelectClass(rowName)}
                          className={`flex items-center justify-center rounded-sm transition-all cursor-pointer font-mono select-none ${
                            isHovered
                              ? 'ring-2 ring-white scale-110 z-30 shadow-lg'
                              : isDiagonal
                              ? 'border border-blue-400/30'
                              : 'border border-transparent'
                          }`}
                        >
                          {cellSize >= 28 && (
                            <span
                              className={`text-[10px] leading-none ${
                                Math.abs(value) > 30 || isDiagonal
                                  ? 'text-white font-medium drop-shadow-xs'
                                  : 'text-slate-300'
                              }`}
                            >
                              {isDeltaMode
                                ? `${value > 0 ? '+' : ''}${value.toFixed(1)}`
                                : isNormalized
                                ? `${value.toFixed(0)}%`
                                : value}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Cell Inspection Banner */}
      <div className="mt-4 p-3.5 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-lg min-h-[58px] flex items-center justify-between flex-wrap gap-3">
        {hoveredCell ? (
          <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-muted)]">Target:</span>
              <span className="font-bold text-[var(--accent)]">
                {classes[hoveredCell.row]}
              </span>
              <span className="text-[var(--text-muted)]">&rarr; Predicted:</span>
              <span className="font-bold text-indigo-400">
                {classes[hoveredCell.col]}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-900/80 px-2.5 py-1 rounded border border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Count: </span>
                <span className="text-white font-bold">{hoveredCell.rawVal ?? hoveredCell.val}</span>
              </div>
              <div className="bg-slate-900/80 px-2.5 py-1 rounded border border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Normalized: </span>
                <span className="text-blue-400 font-bold">
                  {hoveredCell.normVal?.toFixed(2) ?? hoveredCell.val.toFixed(2)}%
                </span>
              </div>
              {hoveredCell.deltaVal !== undefined && (
                <div
                  className={`px-2.5 py-1 rounded border flex items-center gap-1 font-bold ${
                    hoveredCell.row === hoveredCell.col
                      ? hoveredCell.deltaVal >= 0
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : hoveredCell.deltaVal <= 0
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}
                >
                  <span>Δ Baseline:</span>
                  <span>
                    {hoveredCell.deltaVal > 0 ? '+' : ''}
                    {hoveredCell.deltaVal.toFixed(2)} pp
                  </span>
                </div>
              )}
            </div>

            {hoveredCell.row === hoveredCell.col ? (
              <span className="text-emerald-400 text-[11px] font-sans flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Correct Classifications (True Positives)
              </span>
            ) : (
              <span className="text-rose-400 text-[11px] font-sans flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" /> Systematic Misclassification
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Info className="w-4 h-4 text-blue-400" />
            <span>Hover over any cell to inspect exact class confusion pairs, sample counts, and baseline delta deviations.</span>
          </div>
        )}
      </div>
    </div>
  );
};
