import React, { useState, useMemo } from 'react';
import { ParetoPoint } from '../../types';
import { Sparkles, Maximize2, RefreshCw, Layers, ZoomIn } from 'lucide-react';

interface ScatterParetoChartProps {
  points: ParetoPoint[];
  xAxis: 'latency_ms' | 'model_size_mb' | 'energy_j';
  onXAxisChange: (axis: 'latency_ms' | 'model_size_mb' | 'energy_j') => void;
  onlyPareto: boolean;
  onToggleOnlyPareto: (val: boolean) => void;
  onSelectPoint?: (point: ParetoPoint) => void;
  height?: number;
}

const ALG_COLORS: Record<string, string> = {
  GWO: '#3b82f6',
  WOA: '#10b981',
  ALO: '#8b5cf6',
  MFO: '#f59e0b',
  GOA: '#06b6d4',
  MVO: '#ec4899',
  SCA: '#14b8a6',
  AOA: '#f97316',
  MGO: '#6366f1',
  GMO: '#84cc16',
};

export const ScatterParetoChart: React.FC<ScatterParetoChartProps> = ({
  points,
  xAxis,
  onXAxisChange,
  onlyPareto,
  onToggleOnlyPareto,
  onSelectPoint,
  height = 460,
}) => {
  const [hoveredAlg, setHoveredAlg] = useState<string | null>(null);
  const [selectedAlg, setSelectedAlg] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1.0);

  const displayedPoints = useMemo(() => {
    return onlyPareto ? points.filter((p) => p.is_pareto) : points;
  }, [points, onlyPareto]);

  const xAxisLabels: Record<string, { label: string; unit: string }> = {
    latency_ms: { label: 'Inference Latency', unit: 'ms' },
    model_size_mb: { label: 'Model Size', unit: 'MB' },
    energy_j: { label: 'Energy Consumption', unit: 'J' },
  };

  const currentXSpec = xAxisLabels[xAxis];

  // Dynamic spread scale calculation
  const { minX, maxX, minY, maxY, ticksX, ticksY } = useMemo(() => {
    if (!displayedPoints.length) {
      return { minX: 0, maxX: 10, minY: 0, maxY: 100, ticksX: [], ticksY: [] };
    }

    const xVals = displayedPoints.map((p) => p[xAxis]);
    const yVals = displayedPoints.map((p) => p.accuracy);

    const rawMinX = Math.min(...xVals);
    const rawMaxX = Math.max(...xVals);
    const rawMinY = Math.min(...yVals);
    const rawMaxY = Math.max(...yVals);

    const spanX = Math.max(rawMaxX - rawMinX, 0.05);
    const spanY = Math.max(rawMaxY - rawMinY, 0.5);

    // Zoom-adjusted margins to ensure spacious distribution
    const marginX = (spanX * 0.25) / zoomScale;
    const marginY = (spanY * 0.25) / zoomScale;

    const calcMinX = Math.max(0, rawMinX - marginX);
    const calcMaxX = rawMaxX + marginX;
    const calcMinY = Math.max(0, rawMinY - marginY);
    const calcMaxY = Math.min(100, rawMaxY + marginY);

    // 5 evenly spaced ticks
    const count = 5;
    const tX = Array.from({ length: count }, (_, i) => calcMinX + (i / (count - 1)) * (calcMaxX - calcMinX));
    const tY = Array.from({ length: count }, (_, i) => calcMinY + (i / (count - 1)) * (calcMaxY - calcMinY));

    return {
      minX: calcMinX,
      maxX: calcMaxX,
      minY: calcMinY,
      maxY: calcMaxY,
      ticksX: tX,
      ticksY: tY,
    };
  }, [displayedPoints, xAxis, zoomScale]);

  if (!points || points.length === 0) {
    return <div className="lab-card p-6 text-center text-xs text-slate-500">No Pareto data available</div>;
  }

  const svgWidth = 860;
  const svgHeight = height;
  const padding = { top: 30, right: 40, bottom: 65, left: 75 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const getX = (val: number) => padding.left + ((val - minX) / (maxX - minX || 1)) * plotWidth;
  const getY = (val: number) => padding.top + plotHeight - ((val - minY) / (maxY - minY || 1)) * plotHeight;

  // Pareto Frontier Path
  const paretoPointsSorted = [...points]
    .filter((p) => p.is_pareto)
    .sort((a, b) => a[xAxis] - b[xAxis]);

  let paretoPathD = '';
  if (paretoPointsSorted.length > 1) {
    paretoPathD = paretoPointsSorted
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p[xAxis])} ${getY(p.accuracy)}`)
      .join(' ');
  }

  const activePoint = points.find((p) => p.algorithm === (hoveredAlg || selectedAlg)) || null;

  return (
    <div className="lab-card p-5 space-y-4">
      {/* Chart Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Multi-Objective Pareto Analysis &amp; Trade-off Frontier
            </h4>
            <span className="text-[11px] font-mono text-emerald-400">
              {paretoPointsSorted.length} Pareto-Optimal Non-Dominated Solutions Identified
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* X Axis Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono text-[11px]">X-Axis Metric:</span>
            <select
              value={xAxis}
              onChange={(e) => onXAxisChange(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
            >
              <option value="latency_ms">Latency (ms) ↓</option>
              <option value="model_size_mb">Model Size (MB) ↓</option>
              <option value="energy_j">Energy (J) ↓</option>
            </select>
          </div>

          {/* Toggle Pareto filter */}
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 text-xs select-none bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
            <input
              type="checkbox"
              checked={onlyPareto}
              onChange={(e) => onToggleOnlyPareto(e.target.checked)}
              className="rounded bg-slate-900 border-slate-600 text-emerald-500 focus:ring-0"
            />
            <span className="font-medium">Filter Only Pareto</span>
          </label>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700 text-xs font-mono">
            <button
              onClick={() => setZoomScale((z) => Math.min(3.0, z + 0.3))}
              className="px-1.5 py-0.5 rounded bg-slate-750 hover:bg-slate-700 text-slate-300 transition"
              title="Zoom In"
            >
              +
            </button>
            <span className="text-[10px] text-slate-400 px-1">{zoomScale.toFixed(1)}x</span>
            <button
              onClick={() => setZoomScale((z) => Math.max(0.7, z - 0.3))}
              className="px-1.5 py-0.5 rounded bg-slate-750 hover:bg-slate-700 text-slate-300 transition"
              title="Zoom Out"
            >
              -
            </button>
            <button
              onClick={() => setZoomScale(1.0)}
              className="ml-1 text-[10px] text-blue-400 hover:underline"
              title="Reset Zoom"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Algorithm Interactive Badge Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] font-mono text-slate-400 mr-1">Highlight Algorithm:</span>
        {points.map((p) => {
          const isPareto = p.is_pareto;
          const isHighlighted = hoveredAlg === p.algorithm || selectedAlg === p.algorithm;
          const color = ALG_COLORS[p.algorithm] || '#38bdf8';

          return (
            <button
              key={p.algorithm}
              onMouseEnter={() => setHoveredAlg(p.algorithm)}
              onMouseLeave={() => setHoveredAlg(null)}
              onClick={() => {
                const next = selectedAlg === p.algorithm ? null : p.algorithm;
                setSelectedAlg(next);
                if (onSelectPoint) onSelectPoint(p);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 border ${
                isHighlighted
                  ? 'bg-slate-800 text-white shadow-lg scale-105 ring-2'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-600'
              }`}
              style={{
                borderColor: isHighlighted ? color : undefined,
                boxShadow: isHighlighted ? `0 0 12px ${color}40` : undefined,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span>{p.algorithm}</span>
              {isPareto && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                  ★ PARETO
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full min-w-[650px] overflow-visible font-mono"
        >
          <defs>
            <linearGradient id="paretoGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Canvas Grid */}
          <rect
            x={padding.left}
            y={padding.top}
            width={plotWidth}
            height={plotHeight}
            fill="rgba(15, 23, 42, 0.4)"
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
                  stroke="#334155"
                  strokeOpacity="0.4"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 10}
                  y={yPos + 4}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="11"
                >
                  {yVal.toFixed(1)}%
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
                  stroke="#334155"
                  strokeOpacity="0.4"
                  strokeDasharray="4 4"
                />
                <text
                  x={xPos}
                  y={padding.top + plotHeight + 18}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="11"
                >
                  {xVal.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Plot Axes */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + plotHeight}
            stroke="#475569"
            strokeWidth="1.5"
          />
          <line
            x1={padding.left}
            y1={padding.top + plotHeight}
            x2={padding.left + plotWidth}
            y2={padding.top + plotHeight}
            stroke="#475569"
            strokeWidth="1.5"
          />

          {/* Pareto Frontier Connecting Curve */}
          {paretoPathD && (
            <g>
              <path
                d={paretoPathD}
                fill="none"
                stroke="url(#paretoGlow)"
                strokeWidth="3"
                strokeDasharray="6 3"
                filter="url(#glow)"
              />
              <path
                d={paretoPathD}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Scatter Points and Dynamic Dispersed Labels */}
          {displayedPoints.map((point, idx) => {
            const cx = getX(point[xAxis]);
            const cy = getY(point.accuracy);
            const isPareto = point.is_pareto;
            const isHovered = hoveredAlg === point.algorithm || selectedAlg === point.algorithm;
            const color = ALG_COLORS[point.algorithm] || '#38bdf8';

            // Alternating label offsets to avoid clustering collisions
            const labelPositions = [
              { dx: 14, dy: -12, anchor: 'start' },
              { dx: -14, dy: -12, anchor: 'end' },
              { dx: 14, dy: 16, anchor: 'start' },
              { dx: -14, dy: 16, anchor: 'end' },
              { dx: 0, dy: -18, anchor: 'middle' },
              { dx: 0, dy: 22, anchor: 'middle' },
            ];
            const pos = labelPositions[idx % labelPositions.length];

            return (
              <g
                key={point.algorithm + idx}
                className="cursor-pointer transition-transform duration-200"
                onMouseEnter={() => setHoveredAlg(point.algorithm)}
                onMouseLeave={() => setHoveredAlg(null)}
                onClick={() => {
                  setSelectedAlg(selectedAlg === point.algorithm ? null : point.algorithm);
                  if (onSelectPoint) onSelectPoint(point);
                }}
              >
                {/* Crosshairs on hover/select */}
                {isHovered && (
                  <g opacity="0.6">
                    <line
                      x1={padding.left}
                      y1={cy}
                      x2={padding.left + plotWidth}
                      y2={cy}
                      stroke={color}
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1={cx}
                      y1={padding.top}
                      x2={cx}
                      y2={padding.top + plotHeight}
                      stroke={color}
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                  </g>
                )}

                {/* Pareto Halo Pulse */}
                {isPareto && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 16 : 10}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeOpacity={isHovered ? 0.9 : 0.6}
                    className="animate-pulse"
                  />
                )}

                {/* Main Node Point */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 8 : 6}
                  fill={color}
                  stroke="#0f172a"
                  strokeWidth="2"
                  filter={isHovered ? 'url(#glow)' : undefined}
                />

                {/* Leader connecting line for label if hovered */}
                {isHovered && (
                  <line
                    x1={cx}
                    y1={cy}
                    x2={cx + pos.dx}
                    y2={cy + pos.dy}
                    stroke={color}
                    strokeWidth="1.2"
                  />
                )}

                {/* Text Badge Label */}
                <text
                  x={cx + pos.dx}
                  y={cy + pos.dy}
                  textAnchor={pos.anchor as any}
                  fill={isHovered ? '#ffffff' : isPareto ? '#34d399' : '#cbd5e1'}
                  fontSize={isHovered ? '12' : '11'}
                  fontWeight={isHovered || isPareto ? 'bold' : '600'}
                  className="select-none filter drop-shadow"
                >
                  {point.algorithm}
                </text>
              </g>
            );
          })}

          {/* Axis Titles */}
          <text
            x={padding.left + plotWidth / 2}
            y={svgHeight - 12}
            textAnchor="middle"
            fill="#cbd5e1"
            fontSize="12"
            fontWeight="bold"
          >
            {currentXSpec.label} ({currentXSpec.unit}) &rarr; Lower is Better (Compression / Speed)
          </text>
          <text
            x={-svgHeight / 2}
            y="22"
            transform="rotate(-90)"
            textAnchor="middle"
            fill="#cbd5e1"
            fontSize="12"
            fontWeight="bold"
          >
            Accuracy (%) &rarr; Higher is Better
          </text>
        </svg>

        {/* Hover Float Card */}
        {activePoint && (
          <div className="absolute top-4 right-6 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-4 shadow-2xl z-30 text-xs font-mono space-y-2 min-w-[220px] animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: ALG_COLORS[activePoint.algorithm] || '#38bdf8' }}
                />
                <span className="font-bold text-sm text-slate-100">{activePoint.algorithm}</span>
              </div>
              {activePoint.is_pareto ? (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
                  PARETO OPTIMAL
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">Dominated</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-slate-400 block">Accuracy:</span>
                <span className="font-bold text-emerald-400 text-xs">{activePoint.accuracy.toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-slate-400 block">Latency:</span>
                <span className="font-bold text-slate-200 text-xs">{activePoint.latency_ms.toFixed(2)} ms</span>
              </div>
              <div>
                <span className="text-slate-400 block">Model Size:</span>
                <span className="font-bold text-slate-200 text-xs">{activePoint.model_size_mb.toFixed(2)} MB</span>
              </div>
              <div>
                <span className="text-slate-400 block">Energy:</span>
                <span className="font-bold text-slate-200 text-xs">{activePoint.energy_j.toFixed(4)} J</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Weighted Score:</span>
              <span className="font-bold text-blue-400 text-xs">{activePoint.overall_score.toFixed(1)}/100</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
