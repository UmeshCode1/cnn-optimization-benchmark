import React, { useState } from 'react';
import { ParetoPoint } from '../../types';

interface ScatterParetoChartProps {
  points: ParetoPoint[];
  xAxis: 'latency_ms' | 'model_size_mb' | 'energy_j';
  onXAxisChange: (axis: 'latency_ms' | 'model_size_mb' | 'energy_j') => void;
  onlyPareto: boolean;
  onToggleOnlyPareto: (val: boolean) => void;
  onSelectPoint?: (point: ParetoPoint) => void;
  height?: number;
}

export const ScatterParetoChart: React.FC<ScatterParetoChartProps> = ({
  points,
  xAxis,
  onXAxisChange,
  onlyPareto,
  onToggleOnlyPareto,
  onSelectPoint,
  height = 360,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<ParetoPoint | null>(null);

  const displayedPoints = onlyPareto ? points.filter((p) => p.is_pareto) : points;

  const xAxisLabels: Record<string, { label: string; unit: string }> = {
    latency_ms: { label: 'Inference Latency', unit: 'ms' },
    model_size_mb: { label: 'Model Size', unit: 'MB' },
    energy_j: { label: 'Energy Consumption', unit: 'J' },
  };

  const currentXSpec = xAxisLabels[xAxis];

  if (!points || points.length === 0) {
    return <div className="lab-card p-6 text-center text-xs text-slate-500">No Pareto data available</div>;
  }

  // Calculate scales
  const xValues = displayedPoints.map((p) => p[xAxis]);
  const yValues = displayedPoints.map((p) => p.accuracy);

  const minX = Math.max(0, Math.min(...xValues) * 0.85);
  const maxX = Math.max(...xValues) * 1.15;
  const minY = Math.max(0, Math.min(...yValues) - 2.0);
  const maxY = Math.min(100, Math.max(...yValues) + 1.5);

  const svgWidth = 640;
  const svgHeight = height;
  const padding = { top: 20, right: 30, bottom: 50, left: 60 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const getX = (val: number) => padding.left + ((val - minX) / (maxX - minX || 1)) * plotWidth;
  const getY = (val: number) => padding.top + plotHeight - ((val - minY) / (maxY - minY || 1)) * plotHeight;

  // Generate Pareto frontier curve coordinates sorted by X
  const paretoPointsSorted = [...points]
    .filter((p) => p.is_pareto)
    .sort((a, b) => a[xAxis] - b[xAxis]);

  let paretoPathD = '';
  if (paretoPointsSorted.length > 1) {
    paretoPathD = paretoPointsSorted
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p[xAxis])} ${getY(p.accuracy)}`)
      .join(' ');
  }

  return (
    <div className="lab-card p-4 flex flex-col justify-between">
      {/* Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Multi-Objective Pareto Analysis
          </h4>
          <span className="text-[11px] font-mono text-emerald-400">
            {points.filter((p) => p.is_pareto).length} Pareto-Optimal Solutions
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {/* X Axis Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono text-[11px]">X-Axis:</span>
            <select
              value={xAxis}
              onChange={(e) => onXAxisChange(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
            >
              <option value="latency_ms">Latency (ms) ↓</option>
              <option value="model_size_mb">Model Size (MB) ↓</option>
              <option value="energy_j">Energy (J) ↓</option>
            </select>
          </div>

          {/* Toggle Only Pareto */}
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 text-xs select-none">
            <input
              type="checkbox"
              checked={onlyPareto}
              onChange={(e) => onToggleOnlyPareto(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
            />
            <span>Only Pareto Front</span>
          </label>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full flex justify-center">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-[720px] overflow-visible font-mono"
        >
          {/* Grid lines */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + plotHeight}
            stroke="#334155"
            strokeWidth="1"
          />
          <line
            x1={padding.left}
            y1={padding.top + plotHeight}
            x2={padding.left + plotWidth}
            y2={padding.top + plotHeight}
            stroke="#334155"
            strokeWidth="1"
          />

          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((t) => {
            const yVal = minY + t * (maxY - minY);
            const yPos = getY(yVal);
            return (
              <g key={`y-${t}`}>
                <line
                  x1={padding.left}
                  y1={yPos}
                  x2={padding.left + plotWidth}
                  y2={yPos}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={yPos + 4}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                >
                  {yVal.toFixed(1)}%
                </text>
              </g>
            );
          })}

          {/* Vertical Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((t) => {
            const xVal = minX + t * (maxX - minX);
            const xPos = getX(xVal);
            return (
              <g key={`x-${t}`}>
                <line
                  x1={xPos}
                  y1={padding.top}
                  x2={xPos}
                  y2={padding.top + plotHeight}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                />
                <text
                  x={xPos}
                  y={padding.top + plotHeight + 16}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="10"
                >
                  {xVal.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Pareto Frontier Connecting Line */}
          {paretoPathD && (
            <path
              d={paretoPathD}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeDasharray="4 2"
              opacity="0.75"
            />
          )}

          {/* Scatter Points */}
          {displayedPoints.map((point, idx) => {
            const cx = getX(point[xAxis]);
            const cy = getY(point.accuracy);
            const isPareto = point.is_pareto;
            const isHovered = hoveredPoint?.algorithm === point.algorithm;

            return (
              <g
                key={point.algorithm + idx}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
                onClick={() => onSelectPoint && onSelectPoint(point)}
              >
                {/* Outer Ring for Pareto Optimal */}
                {isPareto && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 12 : 8}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    className="transition-all"
                  />
                )}

                {/* Point Center */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 7 : 5}
                  fill={isPareto ? '#10b981' : '#3b82f6'}
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />

                {/* Label text */}
                <text
                  x={cx + 8}
                  y={cy - 6}
                  fill={isPareto ? '#34d399' : '#94a3b8'}
                  fontSize="10"
                  fontWeight={isPareto ? 'bold' : 'normal'}
                >
                  {point.algorithm}
                </text>
              </g>
            );
          })}

          {/* Axis Titles */}
          <text
            x={padding.left + plotWidth / 2}
            y={svgHeight - 10}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="11"
            fontWeight="bold"
          >
            {currentXSpec.label} ({currentXSpec.unit}) &rarr; Lower is Better
          </text>
          <text
            x={-svgHeight / 2}
            y="18"
            transform="rotate(-90)"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="11"
            fontWeight="bold"
          >
            Accuracy (%) &rarr; Higher is Better
          </text>
        </svg>

        {/* Hover Floating Details Card */}
        {hoveredPoint && (
          <div className="absolute top-4 right-4 bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl z-20 text-xs font-mono space-y-1">
            <div className="flex items-center justify-between gap-4 font-bold border-b border-slate-800 pb-1">
              <span className="text-slate-100">{hoveredPoint.algorithm}</span>
              {hoveredPoint.is_pareto && (
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950 text-emerald-300 border border-emerald-700 rounded">
                  PARETO OPTIMAL
                </span>
              )}
            </div>
            <div className="text-slate-300">Accuracy: <strong className="text-emerald-400">{hoveredPoint.accuracy.toFixed(2)}%</strong></div>
            <div className="text-slate-300">Latency: <strong>{hoveredPoint.latency_ms.toFixed(2)} ms</strong></div>
            <div className="text-slate-300">Model Size: <strong>{hoveredPoint.model_size_mb.toFixed(2)} MB</strong></div>
            <div className="text-slate-300">Energy: <strong>{hoveredPoint.energy_j.toFixed(4)} J</strong></div>
            <div className="text-slate-400 text-[11px]">Overall Score: <strong className="text-blue-400">{hoveredPoint.overall_score.toFixed(1)}/100</strong></div>
          </div>
        )}
      </div>
    </div>
  );
};
