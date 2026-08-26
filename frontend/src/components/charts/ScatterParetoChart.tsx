import React, { useState } from 'react';
import {
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { ParetoPoint } from '../../types';

interface ScatterParetoChartProps {
  points: ParetoPoint[];
  xAxis?: 'latency_ms' | 'model_size_mb' | 'energy_j';
  onXAxisChange?: (axis: 'latency_ms' | 'model_size_mb' | 'energy_j') => void;
  onlyPareto?: boolean;
  onToggleOnlyPareto?: (val: boolean) => void;
  onSelectPoint?: (point: ParetoPoint) => void;
  height?: number;
}

export const ScatterParetoChart: React.FC<ScatterParetoChartProps> = ({
  points,
  xAxis = 'latency_ms',
  onXAxisChange = () => {},
  onlyPareto = false,
  onToggleOnlyPareto = () => {},
  onSelectPoint = () => {},
  height = 360,
}) => {
  const [hoveredAlg, setHoveredAlg] = useState<string | null>(null);
  const [selectedAlg, setSelectedAlg] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1.0);

  const metricLabels: Record<string, { label: string; unit: string }> = {
    latency_ms: { label: 'Latency', unit: 'ms' },
    model_size_mb: { label: 'Model Size', unit: 'MB' },
    energy_j: { label: 'Energy', unit: 'J' },
  };

  const currentXMetric = metricLabels[xAxis];

  const filteredPoints = onlyPareto
    ? points.filter((p) => p.is_pareto || p.is_pareto_optimal)
    : points;

  // Compute bounding ranges
  const minXRaw = Math.min(...filteredPoints.map((p) => p[xAxis]), 0);
  const maxXRaw = Math.max(...filteredPoints.map((p) => p[xAxis]), 1);
  const minYRaw = Math.min(...filteredPoints.map((p) => p.accuracy), 0);
  const maxYRaw = Math.max(...filteredPoints.map((p) => p.accuracy), 100);

  const rangeX = Math.max(0.1, maxXRaw - minXRaw);
  const rangeY = Math.max(0.2, maxYRaw - minYRaw);

  const minX = Math.max(0, minXRaw - rangeX * 0.12 * zoomScale);
  const maxX = maxXRaw + rangeX * 0.12 * zoomScale;
  const minY = Math.max(0, minYRaw - rangeY * 0.15 * zoomScale);
  const maxY = Math.min(100, maxYRaw + rangeY * 0.15 * zoomScale);

  const ticksX = [0, 0.25, 0.5, 0.75, 1.0].map((t) => minX + t * (maxX - minX));
  const ticksY = [0, 0.25, 0.5, 0.75, 1.0].map((t) => minY + t * (maxY - minY));

  const svgWidth = 720;
  const svgHeight = height;
  const padding = { top: 30, right: 30, bottom: 50, left: 65 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const getX = (val: number) => padding.left + ((val - minX) / (maxX - minX || 1)) * plotWidth;
  const getY = (val: number) => padding.top + plotHeight - ((val - minY) / (maxY - minY || 1)) * plotHeight;

  // Pareto Frontier Path
  const paretoPointsSorted = [...points]
    .filter((p) => p.is_pareto || p.is_pareto_optimal)
    .sort((a, b) => a[xAxis] - b[xAxis]);

  let paretoPathD = '';
  if (paretoPointsSorted.length > 1) {
    paretoPathD = paretoPointsSorted
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p[xAxis])} ${getY(p.accuracy)}`)
      .join(' ');
  }

  const activePoint = points.find((p) => p.algorithm === (hoveredAlg || selectedAlg)) || null;

  // Algorithm Distinct Colors
  const algColors: Record<string, string> = {
    GWO: '#388bfd',
    WOA: '#2ea043',
    ALO: '#8957e5',
    MFO: '#d29922',
    GOA: '#00d2ff',
    MVO: '#3fb950',
    SCA: '#22d3ee',
    AOA: '#f97316',
    MGO: '#ec4899',
    GMO: '#10b981',
  };

  return (
    <div className="ws-panel p-5 space-y-4">
      {/* Chart Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/30 text-[var(--success)]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="ws-section-title">
              Multi-Objective Pareto Analysis &amp; Trade-off Frontier
            </h4>
            <span className="text-[11px] font-mono text-[var(--success)] font-medium">
              {paretoPointsSorted.length} Pareto-Optimal Non-Dominated Solutions Identified
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* X Axis Selector */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-[var(--text-muted)] text-[11px]">X-Axis Metric:</span>
            <select
              value={xAxis}
              onChange={(e) => onXAxisChange(e.target.value as any)}
              className="ws-input px-2.5 py-1 text-xs font-mono"
            >
              <option value="latency_ms">Latency (ms) ↓</option>
              <option value="model_size_mb">Model Size (MB) ↓</option>
              <option value="energy_j">Energy (J) ↓</option>
            </select>
          </div>

          {/* Toggle Pareto filter */}
          <label className="flex items-center gap-1.5 cursor-pointer text-xs select-none px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={onlyPareto}
              onChange={(e) => onToggleOnlyPareto(e.target.checked)}
              className="rounded text-[var(--success)] focus:ring-0"
            />
            <span className="font-medium">Filter Only Pareto</span>
          </label>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-[var(--border)] bg-[var(--surface-secondary)] text-xs font-mono">
            <button
              onClick={() => setZoomScale((z) => Math.min(2.5, z + 0.2))}
              className="px-1.5 py-0.5 rounded hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] transition"
              title="Zoom In"
            >
              +
            </button>
            <span className="text-[10px] text-[var(--text-muted)] px-1">{zoomScale.toFixed(1)}x</span>
            <button
              onClick={() => setZoomScale((z) => Math.max(0.6, z - 0.2))}
              className="px-1.5 py-0.5 rounded hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] transition"
              title="Zoom Out"
            >
              -
            </button>
            <button
              onClick={() => setZoomScale(1.0)}
              className="px-1.5 py-0.5 rounded hover:bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-[10px] ml-1 transition"
              title="Reset Zoom"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Algorithm Quick Selection Chips */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
        <span className="text-[var(--text-muted)] text-[11px] mr-1">Highlight Algorithm:</span>
        {points.map((p) => {
          const isSelected = (hoveredAlg || selectedAlg) === p.algorithm;
          const isPareto = p.is_pareto || p.is_pareto_optimal;
          const color = algColors[p.algorithm] || 'var(--accent)';
          return (
            <button
              key={p.algorithm}
              onMouseEnter={() => setHoveredAlg(p.algorithm)}
              onMouseLeave={() => setHoveredAlg(null)}
              onClick={() => {
                const next = selectedAlg === p.algorithm ? null : p.algorithm;
                setSelectedAlg(next);
                if (next) onSelectPoint(p);
              }}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] transition-all border ${
                isSelected
                  ? 'border-[var(--accent)] bg-[var(--surface-elevated)] text-[var(--text-primary)] font-bold shadow-sm'
                  : 'border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span>{p.algorithm}</span>
              {isPareto && (
                <span className="text-[9px] font-bold text-[var(--success)] uppercase">★ Pareto</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main SVG Scatter Plot */}
      <div className="relative w-full flex justify-center">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-[850px] overflow-visible font-mono"
        >
          <defs>
            <linearGradient id="paretoGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Background Canvas Grid */}
          <rect
            x={padding.left}
            y={padding.top}
            width={plotWidth}
            height={plotHeight}
            fill="var(--surface-secondary)"
            fillOpacity="0.35"
            stroke="var(--border)"
            rx="6"
          />

          {/* Horizontal Grid lines */}
          {ticksY.map((yVal, i) => {
            const yPos = getY(yVal);
            return (
              <g key={`y-${i}`}>
                <line
                  x1={padding.left}
                  y1={yPos}
                  x2={padding.left + plotWidth}
                  y2={yPos}
                  stroke="var(--border)"
                  strokeOpacity="0.6"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={yPos + 3.5}
                  textAnchor="end"
                  fill="var(--text-muted)"
                  fontSize="10"
                >
                  {yVal.toFixed(rangeY < 0.2 ? 2 : 1)}%
                </text>
              </g>
            );
          })}

          {/* Vertical Grid lines */}
          {ticksX.map((xVal, i) => {
            const xPos = getX(xVal);
            return (
              <g key={`x-${i}`}>
                <line
                  x1={xPos}
                  y1={padding.top}
                  x2={xPos}
                  y2={padding.top + plotHeight}
                  stroke="var(--border)"
                  strokeOpacity="0.6"
                  strokeDasharray="3 3"
                />
                <text
                  x={xPos}
                  y={padding.top + plotHeight + 16}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="10"
                >
                  {xVal.toFixed(xAxis === 'energy_j' ? 4 : 2)}
                </text>
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={padding.left + plotWidth / 2}
            y={padding.top + plotHeight + 36}
            textAnchor="middle"
            fill="var(--text-secondary)"
            fontSize="11"
            fontWeight="600"
          >
            {currentXMetric.label} ({currentXMetric.unit}) &bull; Lower is Better &rarr;
          </text>

          <text
            transform={`rotate(-90) translate(-${padding.top + plotHeight / 2}, 18)`}
            textAnchor="middle"
            fill="var(--text-secondary)"
            fontSize="11"
            fontWeight="600"
          >
            Accuracy (%) &bull; Higher is Better &rarr;
          </text>

          {/* Pareto Frontier Curve Line */}
          {paretoPathD && (
            <g>
              <path
                d={paretoPathD}
                fill="none"
                stroke="url(#paretoGlow)"
                strokeWidth="2.5"
                strokeDasharray="4 2"
              />
            </g>
          )}

          {/* Scatter Data Points */}
          {filteredPoints.map((p) => {
            const cx = getX(p[xAxis]);
            const cy = getY(p.accuracy);
            const isPareto = p.is_pareto || p.is_pareto_optimal;
            const isHovered = hoveredAlg === p.algorithm;
            const isSelected = selectedAlg === p.algorithm;
            const pointColor = algColors[p.algorithm] || 'var(--accent)';

            return (
              <g
                key={p.algorithm}
                className="cursor-pointer transition-transform"
                onMouseEnter={() => setHoveredAlg(p.algorithm)}
                onMouseLeave={() => setHoveredAlg(null)}
                onClick={() => {
                  setSelectedAlg(p.algorithm);
                  onSelectPoint(p);
                }}
              >
                {/* Pareto Ring Pulse */}
                {isPareto && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 14 : 9}
                    fill="none"
                    stroke="var(--success)"
                    strokeWidth={isHovered ? '2' : '1.5'}
                    strokeOpacity={isHovered ? 0.9 : 0.5}
                  />
                )}

                {/* Main Data Point */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered || isSelected ? 7 : 5}
                  fill={pointColor}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  className="transition-all"
                />

                {/* Algorithm Label Tag */}
                <text
                  x={cx}
                  y={cy - (isHovered ? 12 : 9)}
                  textAnchor="middle"
                  fill={isHovered || isSelected ? 'var(--text-primary)' : 'var(--text-secondary)'}
                  fontSize="10"
                  fontWeight={isHovered || isSelected || isPareto ? '700' : '500'}
                >
                  {p.algorithm}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip Card */}
        {activePoint && (
          <div className="absolute top-2 right-2 ws-panel-elevated p-3 text-xs font-mono shadow-lg z-20 space-y-1 max-w-xs">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-1">
              <span className="font-bold text-[var(--text-primary)] text-sm">{activePoint.algorithm}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                  activePoint.is_pareto || activePoint.is_pareto_optimal
                    ? 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/30'
                    : 'bg-[var(--surface-secondary)] text-[var(--text-muted)]'
                }`}
              >
                {activePoint.is_pareto || activePoint.is_pareto_optimal ? '★ PARETO OPTIMAL' : 'DOMINATED'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Top-1 Accuracy:</span>
              <strong className="text-[var(--success)] font-bold">{activePoint.accuracy.toFixed(2)}%</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Latency:</span>
              <strong className="text-[var(--text-primary)]">{activePoint.latency_ms.toFixed(2)} ms</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Model Size:</span>
              <span className="text-[var(--text-secondary)]">{activePoint.model_size_mb.toFixed(2)} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Energy / Pass:</span>
              <span className="text-[var(--text-secondary)]">{activePoint.energy_j.toFixed(4)} J</span>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-1">
              <span className="text-[var(--text-muted)]">Overall Score:</span>
              <strong className="text-[var(--accent)] font-bold">{activePoint.overall_score.toFixed(1)} / 100</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
