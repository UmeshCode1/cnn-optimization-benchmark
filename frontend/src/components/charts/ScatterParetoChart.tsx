import React, { useState } from 'react';
import {
  Sparkles,
  Info,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ShieldCheck,
  Award,
  Zap,
  Cpu,
} from 'lucide-react';
import { ParetoPoint } from '../../types';

export type ParetoAxisType = 'latency_ms' | 'model_size_mb' | 'energy_j' | 'power_w' | 'flops_m' | 'tops';

interface ScatterParetoChartProps {
  points: ParetoPoint[];
  xAxis?: ParetoAxisType;
  onXAxisChange?: (axis: ParetoAxisType) => void;
  onlyPareto?: boolean;
  onToggleOnlyPareto?: (val: boolean) => void;
  onSelectPoint?: (point: ParetoPoint) => void;
  height?: number;
}

const ALG_COLORS: Record<string, string> = {
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

export const ScatterParetoChart: React.FC<ScatterParetoChartProps> = ({
  points,
  xAxis = 'latency_ms',
  onXAxisChange = () => {},
  onlyPareto = false,
  onToggleOnlyPareto = () => {},
  onSelectPoint = () => {},
  height = 390,
}) => {
  const [hoveredAlg, setHoveredAlg] = useState<string | null>(null);
  const [selectedAlg, setSelectedAlg] = useState<string | null>(null);

  const metricLabels: Record<ParetoAxisType, { label: string; unit: string; direction: '↓' | '↑' }> = {
    latency_ms: { label: 'Inference Latency', unit: 'ms', direction: '↓' },
    power_w: { label: 'Average Power Consumption', unit: 'W', direction: '↓' },
    energy_j: { label: 'Energy per Inference', unit: 'J', direction: '↓' },
    flops_m: { label: 'Computational Load (FLOPs)', unit: 'M', direction: '↓' },
    tops: { label: 'Compute Throughput Density', unit: 'TOPs', direction: '↑' },
    model_size_mb: { label: 'Model Footprint', unit: 'MB', direction: '↓' },
  };

  const currentXMetric = metricLabels[xAxis] || metricLabels.latency_ms;

  const getPointX = (p: any): number => {
    if (xAxis === 'power_w') {
      return p.power_w || (p.energy_j / Math.max(0.0001, p.latency_ms * 0.001));
    }
    if (xAxis === 'flops_m') {
      return p.flops_m || (p.parameters_m ? p.parameters_m * 50 : 330.0);
    }
    if (xAxis === 'tops') {
      const f = p.flops_m || (p.parameters_m ? p.parameters_m * 50 : 330.0);
      return (f * 1e6) / (Math.max(0.001, p.latency_ms) * 1e-3 * 1e12);
    }
    return p[xAxis] || 0;
  };

  const filteredPoints = onlyPareto
    ? points.filter((p) => p.is_pareto || p.is_pareto_optimal)
    : points;

  // Compute clean data-driven bounds
  const xVals = filteredPoints.map((p) => getPointX(p));
  const yVals = filteredPoints.map((p) => p.accuracy);

  const dataMinX = xVals.length > 0 ? Math.min(...xVals) : 0;
  const dataMaxX = xVals.length > 0 ? Math.max(...xVals) : 10;
  const dataMinY = yVals.length > 0 ? Math.min(...yVals) : 80;
  const dataMaxY = yVals.length > 0 ? Math.max(...yVals) : 100;

  const spanX = Math.max(0.05, dataMaxX - dataMinX);
  const spanY = Math.max(0.1, dataMaxY - dataMinY);

  const padX = spanX * 0.18;
  const padY = spanY * 0.18;

  const minX = Math.max(0, dataMinX - padX);
  const maxX = dataMaxX + padX;
  const minY = Math.max(0, dataMinY - padY);
  const maxY = Math.min(100, dataMaxY + padY);

  const svgWidth = 740;
  const svgHeight = height;
  const padding = { top: 35, right: 35, bottom: 55, left: 70 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const getX = (val: number) => padding.left + ((val - minX) / (maxX - minX || 1e-6)) * plotWidth;
  const getY = (val: number) => padding.top + plotHeight - ((val - minY) / (maxY - minY || 1e-6)) * plotHeight;

  // Pareto Frontier Path sorted by X
  const paretoPointsSorted = [...points]
    .filter((p) => p.is_pareto || p.is_pareto_optimal)
    .sort((a, b) => getPointX(a) - getPointX(b));

  let paretoPathD = '';
  if (paretoPointsSorted.length > 1) {
    paretoPathD = paretoPointsSorted
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(getPointX(p))} ${getY(p.accuracy)}`)
      .join(' ');
  }

  const activePoint: any = points.find((p) => p.algorithm === (hoveredAlg || selectedAlg)) || null;

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
              {paretoPointsSorted.length} Non-Dominated Solutions on Empirical Pareto Frontier
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* X Axis Selector */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-[var(--text-muted)] text-[11px]">Trade-off Metric (X-Axis):</span>
            <select
              value={xAxis}
              onChange={(e) => onXAxisChange(e.target.value as ParetoAxisType)}
              className="ws-input px-2.5 py-1 text-xs font-mono cursor-pointer"
            >
              <option value="latency_ms">Inference Latency (ms) ↓</option>
              <option value="power_w">Power Consumption (Watts) ↓</option>
              <option value="energy_j">Energy per Inference (J) ↓</option>
              <option value="flops_m">FLOPs Complexity (M) ↓</option>
              <option value="tops">Compute Throughput (TOPs) ↑</option>
              <option value="model_size_mb">Model Size (MB) ↓</option>
            </select>
          </div>

          {/* Toggle Pareto filter */}
          <label className="flex items-center gap-1.5 cursor-pointer text-xs select-none px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={onlyPareto}
              onChange={(e) => onToggleOnlyPareto(e.target.checked)}
              className="rounded text-[var(--success)] focus:ring-0 cursor-pointer"
            />
            <span>Filter Only Pareto</span>
          </label>
        </div>
      </div>

      {/* Algorithm Quick Selection Chips */}
      <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
        <span className="text-[var(--text-muted)] text-[11px] mr-1">Highlight:</span>
        {points.map((p) => {
          const isPareto = p.is_pareto || p.is_pareto_optimal;
          const isSelected = selectedAlg === p.algorithm;
          const color = ALG_COLORS[p.algorithm] || 'var(--accent)';
          return (
            <button
              key={p.algorithm}
              onClick={() => {
                const next = selectedAlg === p.algorithm ? null : p.algorithm;
                setSelectedAlg(next);
                if (next) onSelectPoint(p);
              }}
              onMouseEnter={() => setHoveredAlg(p.algorithm)}
              onMouseLeave={() => setHoveredAlg(null)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all flex items-center gap-1 border cursor-pointer ${
                isSelected
                  ? 'bg-[var(--surface-elevated)] border-[var(--accent)] font-bold text-[var(--text-primary)] shadow-sm'
                  : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)] opacity-75 hover:opacity-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span>{p.algorithm}</span>
              {isPareto && <span className="text-[9px] text-[var(--success)] font-bold">★</span>}
            </button>
          );
        })}
      </div>

      {/* Main SVG Plot Canvas */}
      <div className="relative overflow-hidden bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto select-none"
          style={{ maxHeight: height }}
        >
          <defs>
            <linearGradient id="paretoFrontGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
            </linearGradient>
            <filter id="glowScatter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>

          {/* Plot Background */}
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

          {/* Grid lines X */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((t) => {
            const val = minX + t * (maxX - minX);
            const xPos = getX(val);
            return (
              <g key={`x-${t}`}>
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
                  {val.toFixed(xAxis === 'energy_j' ? 4 : spanX < 1 ? 3 : 1)}
                </text>
              </g>
            );
          })}

          {/* Grid lines Y */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((t) => {
            const val = minY + t * (maxY - minY);
            const yPos = getY(val);
            return (
              <g key={`y-${t}`}>
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
                  {val.toFixed(1)}%
                </text>
              </g>
            );
          })}

          {/* Connected Pareto Frontier Line */}
          {paretoPathD && (
            <path
              d={paretoPathD}
              fill="none"
              stroke="url(#paretoFrontGlow)"
              strokeWidth="2.5"
              strokeDasharray="4 3"
              filter="url(#glowScatter)"
            />
          )}

          {/* Scatter Points */}
          {filteredPoints.map((p, idx) => {
            const valX = getPointX(p);
            const cx = getX(valX);
            const cy = getY(p.accuracy);
            const isPareto = p.is_pareto || p.is_pareto_optimal;
            const isHovered = hoveredAlg === p.algorithm;
            const isSelected = selectedAlg === p.algorithm;
            const color = ALG_COLORS[p.algorithm] || 'var(--accent)';

            const labelOffset = idx % 2 === 0 ? -12 : 16;

            return (
              <g
                key={p.algorithm}
                className="cursor-pointer transition-transform"
                onClick={() => {
                  setSelectedAlg(p.algorithm);
                  onSelectPoint(p);
                }}
                onMouseEnter={() => setHoveredAlg(p.algorithm)}
                onMouseLeave={() => setHoveredAlg(null)}
              >
                {/* Pareto halo */}
                {isPareto && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected || isHovered ? 14 : 9}
                    fill={color}
                    fillOpacity="0.18"
                    stroke={color}
                    strokeWidth="1.5"
                    className="animate-pulse"
                  />
                )}

                {/* Point circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected || isHovered ? 7 : isPareto ? 5.5 : 4}
                  fill={color}
                  stroke="#ffffff"
                  strokeWidth={isHovered || isSelected ? 2 : 1}
                />

                {/* Text tag */}
                <text
                  x={cx}
                  y={cy + labelOffset}
                  textAnchor="middle"
                  fill="var(--text-primary)"
                  fontSize={isSelected || isHovered ? '11' : '9.5'}
                  fontWeight={isPareto || isSelected ? 'bold' : 'normal'}
                  className="font-mono pointer-events-none"
                >
                  {p.algorithm}
                </text>
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={padding.left + plotWidth / 2}
            y={svgHeight - 12}
            textAnchor="middle"
            fill="var(--text-primary)"
            fontSize="11"
            className="font-sans font-medium"
          >
            {currentXMetric.label} ({currentXMetric.unit}) • {currentXMetric.direction === '↓' ? 'Lower is Better' : 'Higher is Better'}
          </text>

          <text
            x={16}
            y={padding.top + plotHeight / 2}
            textAnchor="middle"
            fill="var(--text-primary)"
            fontSize="11"
            className="font-sans font-medium"
            transform={`rotate(-90 16 ${padding.top + plotHeight / 2})`}
          >
            Top-1 Classification Accuracy (%) • Higher is Better →
          </text>
        </svg>

        {/* Floating Telemetry Tooltip for Active Point */}
        {activePoint && (
          <div className="absolute top-4 right-4 ws-panel p-3.5 shadow-2xl border border-[var(--border-strong)] z-20 text-xs font-mono space-y-1.5 w-64 animate-fade-in pointer-events-none bg-[var(--surface-elevated)]/95 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-1.5">
              <span className="font-bold text-[var(--text-primary)] text-sm flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: ALG_COLORS[activePoint.algorithm] || 'var(--accent)' }}
                />
                <span>{activePoint.algorithm}</span>
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  activePoint.is_pareto || activePoint.is_pareto_optimal
                    ? 'bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/30'
                    : 'bg-[var(--surface-secondary)] text-[var(--text-muted)]'
                }`}
              >
                {activePoint.is_pareto || activePoint.is_pareto_optimal
                  ? '★ NON-DOMINATED'
                  : 'DOMINATED'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Top-1 Accuracy:</span>
              <strong className="text-[var(--success)] font-bold">
                {activePoint.accuracy.toFixed(2)}%
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Inference Latency:</span>
              <strong className="text-[var(--text-primary)]">
                {activePoint.latency_ms.toFixed(2)} ms
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Average Power:</span>
              <strong className="text-[var(--warning)]">
                {((activePoint.power_w || (activePoint.energy_j / Math.max(0.0001, activePoint.latency_ms * 0.001)))).toFixed(2)} W
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">FLOPs Complexity:</span>
              <span className="text-[var(--text-secondary)]">
                {(activePoint.flops_m || (activePoint.parameters_m ? activePoint.parameters_m * 50 : 330)).toFixed(1)} M
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Compute Throughput:</span>
              <strong className="text-[var(--accent)] font-semibold">
                {(((activePoint.flops_m || 330) * 1e6) / (Math.max(0.001, activePoint.latency_ms) * 1e-3 * 1e12)).toFixed(3)} TOPs
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Model Size:</span>
              <span className="text-[var(--text-secondary)]">
                {activePoint.model_size_mb.toFixed(2)} MB
              </span>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-1">
              <span className="text-[var(--text-muted)]">Composite Score:</span>
              <strong className="text-[var(--accent)] font-bold">
                {activePoint.overall_score.toFixed(1)} / 100
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
