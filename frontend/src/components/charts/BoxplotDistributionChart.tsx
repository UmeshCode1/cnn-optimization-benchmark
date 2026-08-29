import React, { useState } from 'react';
import { AlgorithmStats } from '../../types';
import { Activity, BarChart2, CheckCircle2 } from 'lucide-react';

export type BoxplotMetricKey = 'accuracy' | 'latency_ms' | 'power_w' | 'energy_j' | 'flops_m' | 'model_size_mb' | 'overall_score';

interface BoxplotDistributionChartProps {
  stats: Record<string, AlgorithmStats>;
  metricKey: BoxplotMetricKey;
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

export const BoxplotDistributionChart: React.FC<BoxplotDistributionChartProps> = ({
  stats,
  metricKey,
  height = 360,
}) => {
  const [hoveredAlg, setHoveredAlg] = useState<string | null>(null);

  const metricLabels: Record<BoxplotMetricKey, { label: string; unit: string; higherBetter: boolean }> = {
    accuracy: { label: 'Top-1 Accuracy Distribution', unit: '%', higherBetter: true },
    latency_ms: { label: 'Latency Distribution', unit: 'ms', higherBetter: false },
    power_w: { label: 'Average Power Draw Distribution', unit: 'W', higherBetter: false },
    energy_j: { label: 'Energy Consumption Distribution', unit: 'J', higherBetter: false },
    flops_m: { label: 'FLOPs Computational Load', unit: 'M', higherBetter: false },
    model_size_mb: { label: 'Model Size Distribution', unit: 'MB', higherBetter: false },
    overall_score: { label: 'Overall Score Distribution', unit: '/100', higherBetter: true },
  };

  const currentMetric = metricLabels[metricKey] || metricLabels.accuracy;
  const algKeys = Object.keys(stats);

  if (algKeys.length === 0) {
    return (
      <div className="ws-panel p-6 text-center text-xs text-[var(--text-muted)] font-mono">
        No multi-run statistical data available
      </div>
    );
  }

  // Find min and max across all algorithms for this metric
  let globalMin = Infinity;
  let globalMax = -Infinity;

  algKeys.forEach((alg) => {
    const summary = (stats[alg] as any)?.[metricKey];
    if (summary) {
      globalMin = Math.min(globalMin, summary.min_val);
      globalMax = Math.max(globalMax, summary.max_val);
    }
  });

  if (!isFinite(globalMin) || !isFinite(globalMax)) {
    globalMin = 0;
    globalMax = 100;
  }

  const range = Math.max(0.01, globalMax - globalMin);
  const padDelta = Math.max(range * 0.2, metricKey === 'accuracy' ? 0.3 : 0.05);
  const plotMin = Math.max(0, globalMin - padDelta);
  const plotMax = globalMax + padDelta;

  const svgWidth = 740;
  const svgHeight = height;
  const padding = { top: 25, right: 30, bottom: 48, left: 65 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const getY = (val: number) =>
    padding.top + plotHeight - ((val - plotMin) / (plotMax - plotMin || 1e-6)) * plotHeight;
  const colWidth = plotWidth / algKeys.length;

  return (
    <div className="ws-panel p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)]">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="ws-section-title">
              Stochastic Multi-Run Boxplot: {currentMetric.label}
            </h4>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              Min &bull; Q1 / 95% CI Lower &bull; Median (—) &bull; Mean (◆) &bull; Q3 / 95% CI Upper &bull; Max
            </span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full flex justify-center">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-[850px] overflow-visible font-mono"
        >
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

          {/* Y Axis Guide Lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((t) => {
            const val = plotMin + t * (plotMax - plotMin);
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
                  {val.toFixed(metricKey === 'energy_j' ? 4 : range < 0.5 ? 2 : 1)}
                </text>
              </g>
            );
          })}

          {/* Boxplots for each algorithm */}
          {algKeys.map((alg, idx) => {
            const summary = (stats[alg] as any)?.[metricKey];
            if (!summary) return null;

            const centerX = padding.left + idx * colWidth + colWidth / 2;
            const boxWidth = Math.min(28, colWidth * 0.65);
            const color = ALG_COLORS[alg] || 'var(--accent)';

            const yMin = getY(summary.min_val);
            const yMax = getY(summary.max_val);
            const yMedian = getY(summary.median);
            const yMean = getY(summary.mean);
            const yCiLower = getY(summary.ci_95_lower);
            const yCiUpper = getY(summary.ci_95_upper);

            const isHovered = hoveredAlg === alg;

            return (
              <g
                key={alg}
                onMouseEnter={() => setHoveredAlg(alg)}
                onMouseLeave={() => setHoveredAlg(null)}
                className="cursor-pointer transition-all"
              >
                {/* Whisker Vertical Line (Min to Max) */}
                <line
                  x1={centerX}
                  y1={yMin}
                  x2={centerX}
                  y2={yMax}
                  stroke={color}
                  strokeWidth={isHovered ? 2 : 1.5}
                  strokeDasharray="2 2"
                />

                {/* Min / Max Whisker Caps */}
                <line
                  x1={centerX - boxWidth / 3}
                  y1={yMin}
                  x2={centerX + boxWidth / 3}
                  y2={yMin}
                  stroke={color}
                  strokeWidth="1.5"
                />
                <line
                  x1={centerX - boxWidth / 3}
                  y1={yMax}
                  x2={centerX + boxWidth / 3}
                  y2={yMax}
                  stroke={color}
                  strokeWidth="1.5"
                />

                {/* 95% Confidence Interval / IQR Box */}
                <rect
                  x={centerX - boxWidth / 2}
                  y={Math.min(yCiLower, yCiUpper)}
                  width={boxWidth}
                  height={Math.max(6, Math.abs(yCiLower - yCiUpper))}
                  fill={isHovered ? `${color}50` : `${color}25`}
                  stroke={color}
                  strokeWidth={isHovered ? 2 : 1.5}
                  rx="3"
                  className="transition-colors duration-150"
                />

                {/* Median Solid Line */}
                <line
                  x1={centerX - boxWidth / 2}
                  y1={yMedian}
                  x2={centerX + boxWidth / 2}
                  y2={yMedian}
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                />

                {/* Mean Diamond Marker */}
                <polygon
                  points={`${centerX},${yMean - 4} ${centerX + 4},${yMean} ${centerX},${yMean + 4} ${centerX - 4},${yMean}`}
                  fill="#F59E0B"
                  stroke="#000000"
                  strokeWidth="0.8"
                />

                {/* X Axis Algorithm Label */}
                <text
                  x={centerX}
                  y={padding.top + plotHeight + 16}
                  textAnchor="middle"
                  fill={isHovered ? 'var(--text-primary)' : 'var(--text-secondary)'}
                  fontWeight={isHovered ? 'bold' : 'normal'}
                  fontSize={isHovered ? '11' : '10'}
                  className="transition-colors font-mono"
                >
                  {alg}
                </text>
              </g>
            );
          })}

          {/* Y Axis Unit Label */}
          <text
            x={16}
            y={padding.top + plotHeight / 2}
            textAnchor="middle"
            fill="var(--text-muted)"
            fontSize="10"
            className="font-sans"
            transform={`rotate(-90 16 ${padding.top + plotHeight / 2})`}
          >
            {currentMetric.label} ({currentMetric.unit})
          </text>
        </svg>

        {/* Hover Tooltip Card */}
        {hoveredAlg && stats[hoveredAlg] && (stats[hoveredAlg] as any)[metricKey] && (
          <div className="absolute top-2 right-6 ws-panel p-3 shadow-xl border border-[var(--border-strong)] z-20 text-xs font-mono space-y-1 w-56 animate-fade-in pointer-events-none bg-[var(--surface-elevated)]/95 backdrop-blur-md">
            <div className="font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-1 flex items-center justify-between">
              <span>{hoveredAlg}</span>
              <span className="text-[10px] text-[var(--text-muted)]">
                {stats[hoveredAlg].runs_count} runs
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Mean (◆):</span>
              <span className="font-bold text-amber-400">
                {(stats[hoveredAlg] as any)[metricKey].mean.toFixed(metricKey === 'energy_j' ? 4 : 2)} {currentMetric.unit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Median (—):</span>
              <span className="font-semibold text-cyan-400">
                {(stats[hoveredAlg] as any)[metricKey].median.toFixed(metricKey === 'energy_j' ? 4 : 2)} {currentMetric.unit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Std Dev (σ):</span>
              <span className="text-[var(--text-secondary)]">
                ±{(stats[hoveredAlg] as any)[metricKey].std.toFixed(metricKey === 'energy_j' ? 4 : 2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Min - Max:</span>
              <span className="text-[var(--text-muted)]">
                {(stats[hoveredAlg] as any)[metricKey].min_val.toFixed(metricKey === 'energy_j' ? 4 : 2)} - {(stats[hoveredAlg] as any)[metricKey].max_val.toFixed(metricKey === 'energy_j' ? 4 : 2)}
              </span>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-1 text-[10px]">
              <span className="text-[var(--text-muted)]">95% CI:</span>
              <span className="text-[var(--success)]">
                [{(stats[hoveredAlg] as any)[metricKey].ci_95_lower.toFixed(metricKey === 'energy_j' ? 4 : 2)}, {(stats[hoveredAlg] as any)[metricKey].ci_95_upper.toFixed(metricKey === 'energy_j' ? 4 : 2)}]
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
