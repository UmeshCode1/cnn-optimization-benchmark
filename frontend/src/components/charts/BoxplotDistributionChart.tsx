import React, { useState } from 'react';
import { AlgorithmStats } from '../../types';

interface BoxplotDistributionChartProps {
  stats: Record<string, AlgorithmStats>;
  metricKey: 'accuracy' | 'latency_ms' | 'model_size_mb' | 'energy_j' | 'overall_score';
  height?: number;
}

export const BoxplotDistributionChart: React.FC<BoxplotDistributionChartProps> = ({
  stats,
  metricKey,
  height = 340,
}) => {
  const [hoveredAlg, setHoveredAlg] = useState<string | null>(null);

  const metricLabels: Record<string, { label: string; unit: string; higherBetter: boolean }> = {
    accuracy: { label: 'Accuracy Distribution', unit: '%', higherBetter: true },
    latency_ms: { label: 'Latency Distribution', unit: 'ms', higherBetter: false },
    model_size_mb: { label: 'Model Size Distribution', unit: 'MB', higherBetter: false },
    energy_j: { label: 'Energy Consumption Distribution', unit: 'J', higherBetter: false },
    overall_score: { label: 'Overall Score Distribution', unit: '/100', higherBetter: true },
  };

  const currentMetric = metricLabels[metricKey];
  const algKeys = Object.keys(stats);

  if (algKeys.length === 0) {
    return <div className="ws-panel p-6 text-center text-xs text-[var(--text-muted)] font-mono">No multi-run statistical data available</div>;
  }

  // Find min and max across all algorithms for this metric
  let globalMin = Infinity;
  let globalMax = -Infinity;

  algKeys.forEach((alg) => {
    const summary = stats[alg][metricKey];
    globalMin = Math.min(globalMin, summary.min_val);
    globalMax = Math.max(globalMax, summary.max_val);
  });

  const range = globalMax - globalMin || 1.0;
  const plotMin = Math.max(0, globalMin - range * 0.1);
  const plotMax = globalMax + range * 0.1;

  const svgWidth = 640;
  const svgHeight = height;
  const padding = { top: 20, right: 30, bottom: 45, left: 60 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const getY = (val: number) => padding.top + plotHeight - ((val - plotMin) / (plotMax - plotMin || 1e-6)) * plotHeight;
  const colWidth = plotWidth / algKeys.length;

  return (
    <div className="ws-panel p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <h4 className="ws-section-title">
          Multi-Run Statistical Boxplot: {currentMetric.label}
        </h4>
        <span className="text-[11px] font-mono text-[var(--text-muted)]">
          Min &bull; Median &bull; Mean &bull; Max &bull; 95% CI
        </span>
      </div>

      <div className="relative w-full flex justify-center">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-[720px] overflow-visible font-mono">
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
                  stroke="currentColor"
                  className="text-[var(--border)]"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={yPos + 4}
                  textAnchor="end"
                  fill="currentColor"
                  className="text-[var(--text-muted)]"
                  fontSize="10"
                >
                  {val.toFixed(metricKey === 'energy_j' ? 4 : 2)}
                </text>
              </g>
            );
          })}

          {/* Boxplots */}
          {algKeys.map((alg, idx) => {
            const summary = stats[alg][metricKey];
            const centerX = padding.left + idx * colWidth + colWidth / 2;
            const boxWidth = Math.min(26, colWidth * 0.65);

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
                className="cursor-pointer"
              >
                {/* Whisker Line (Min to Max) */}
                <line
                  x1={centerX}
                  y1={yMin}
                  x2={centerX}
                  y2={yMax}
                  stroke="#3b82f6"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />

                {/* Min / Max Caps */}
                <line x1={centerX - boxWidth / 3} y1={yMin} x2={centerX + boxWidth / 3} y2={yMin} stroke="#3b82f6" strokeWidth="1.5" />
                <line x1={centerX - boxWidth / 3} y1={yMax} x2={centerX + boxWidth / 3} y2={yMax} stroke="#3b82f6" strokeWidth="1.5" />

                {/* 95% Confidence Interval Box */}
                <rect
                  x={centerX - boxWidth / 2}
                  y={Math.min(yCiLower, yCiUpper)}
                  width={boxWidth}
                  height={Math.max(4, Math.abs(yCiLower - yCiUpper))}
                  fill={isHovered ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.12)'}
                  stroke="#3b82f6"
                  strokeWidth="1.5"
                  rx="3"
                  className="transition-colors"
                />

                {/* Median Line */}
                <line
                  x1={centerX - boxWidth / 2}
                  y1={yMedian}
                  x2={centerX + boxWidth / 2}
                  y2={yMedian}
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                />

                {/* Mean Diamond */}
                <polygon
                  points={`${centerX},${yMean - 3.5} ${centerX + 3.5},${yMean} ${centerX},${yMean + 3.5} ${centerX - 3.5},${yMean}`}
                  fill="#f59e0b"
                />

                {/* X Axis Algorithm Label */}
                <text
                  x={centerX}
                  y={padding.top + plotHeight + 18}
                  textAnchor="middle"
                  fill="currentColor"
                  className={isHovered ? 'text-[var(--accent)] font-semibold' : 'text-[var(--text-muted)]'}
                  fontSize="10"
                >
                  {alg}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Details */}
        {hoveredAlg && (
          <div className="absolute top-2 right-2 bg-[var(--surface-elevated)] border border-[var(--border-strong)] rounded-md p-2.5 text-xs font-mono shadow-md z-20 space-y-0.5 text-[var(--text-secondary)]">
            <div className="font-semibold text-[var(--text-primary)] border-b border-[var(--border)] pb-1">
              {hoveredAlg} ({stats[hoveredAlg].runs_count} runs)
            </div>
            <div>Mean: <strong className="text-amber-500">{stats[hoveredAlg][metricKey].mean.toFixed(2)}</strong></div>
            <div>Median: <strong className="text-cyan-500">{stats[hoveredAlg][metricKey].median.toFixed(2)}</strong></div>
            <div>Std Dev: <strong>{stats[hoveredAlg][metricKey].std.toFixed(2)}</strong></div>
            <div>Min / Max: <strong>{stats[hoveredAlg][metricKey].min_val.toFixed(2)} &ndash; {stats[hoveredAlg][metricKey].max_val.toFixed(2)}</strong></div>
            <div>95% CI: <strong>[{stats[hoveredAlg][metricKey].ci_95_lower.toFixed(2)}, {stats[hoveredAlg][metricKey].ci_95_upper.toFixed(2)}]</strong></div>
          </div>
        )}
      </div>
    </div>
  );
};
