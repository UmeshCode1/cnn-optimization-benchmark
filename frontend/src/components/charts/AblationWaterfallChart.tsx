import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { AblationRecord } from '../../types';

interface AblationWaterfallChartProps {
  ablations: AblationRecord[];
  height?: number;
}

type AblationMetric = 'accuracy' | 'latency_ms' | 'model_size_mb' | 'energy_j' | 'flops_m';

export const AblationWaterfallChart: React.FC<AblationWaterfallChartProps> = ({
  ablations,
  height = 360,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<AblationMetric>('latency_ms');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!ablations || ablations.length === 0) return null;

  const metricConfigs: Record<
    AblationMetric,
    { label: string; unit: string; higherBetter: boolean; color: string; format: (v: number) => string }
  > = {
    accuracy: {
      label: 'Top-1 Accuracy',
      unit: '%',
      higherBetter: true,
      color: '#10b981',
      format: (v) => `${v.toFixed(2)}%`,
    },
    latency_ms: {
      label: 'Inference Latency',
      unit: 'ms',
      higherBetter: false,
      color: '#388bfd',
      format: (v) => `${v.toFixed(2)} ms`,
    },
    model_size_mb: {
      label: 'Model Memory Footprint',
      unit: 'MB',
      higherBetter: false,
      color: '#a855f7',
      format: (v) => `${v.toFixed(2)} MB`,
    },
    energy_j: {
      label: 'Energy per Pass',
      unit: 'J',
      higherBetter: false,
      color: '#f59e0b',
      format: (v) => `${v.toFixed(4)} J`,
    },
    flops_m: {
      label: 'Computational FLOPs',
      unit: 'M',
      higherBetter: false,
      color: '#00d2ff',
      format: (v) => `${v.toFixed(1)} M`,
    },
  };

  const config = metricConfigs[selectedMetric];
  const baselineVal = ablations[0][selectedMetric] || 1;
  const values = ablations.map((a) => a[selectedMetric]);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  // SVG dimensions
  const svgWidth = 760;
  const svgHeight = height;
  const padding = { top: 35, right: 35, bottom: 65, left: 75 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Scaling
  const range = Math.max(0.01, maxVal - minVal);
  const padBottom = selectedMetric === 'accuracy' ? Math.max(0, minVal - range * 0.3) : 0;
  const padTop = maxVal + range * 0.18;

  const getY = (val: number) =>
    padding.top + plotHeight - ((val - padBottom) / (padTop - padBottom || 1e-6)) * plotHeight;

  const colWidth = plotWidth / ablations.length;
  const barWidth = Math.min(54, colWidth * 0.68);

  return (
    <div className="ws-panel p-5 space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="ws-section-title">
              Sequential Decomposition &amp; Step Waterfall
            </h4>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              Cumulative ablation contribution across compression pipeline stages
            </span>
          </div>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          {(Object.keys(metricConfigs) as AblationMetric[]).map((key) => {
            const isSelected = selectedMetric === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedMetric(key)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] border-[var(--accent)] font-semibold shadow-sm'
                    : 'bg-[var(--surface-secondary)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]'
                }`}
              >
                {metricConfigs[key].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Waterfall Chart */}
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

          {/* Horizontal guides */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((t) => {
            const val = padBottom + t * (padTop - padBottom);
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
                  {config.format(val)}
                </text>
              </g>
            );
          })}

          {/* Stepped Line Path Connecting Bars */}
          <path
            d={ablations
              .map((a, i) => {
                const cx = padding.left + i * colWidth + colWidth / 2;
                const cy = getY(a[selectedMetric]);
                return `${i === 0 ? 'M' : 'L'} ${cx} ${cy}`;
              })
              .join(' ')}
            fill="none"
            stroke={config.color}
            strokeWidth="2"
            strokeDasharray="4 3"
            opacity="0.75"
          />

          {/* Waterfall Stage Bars */}
          {ablations.map((a, idx) => {
            const val = a[selectedMetric];
            const cx = padding.left + idx * colWidth + colWidth / 2;
            const barX = cx - barWidth / 2;
            const yTop = getY(val);
            const yZero = getY(padBottom);
            const barHeight = Math.max(4, yZero - yTop);
            const isHovered = hoveredIndex === idx;
            const isFinalStage = idx === ablations.length - 1;

            // Delta vs previous stage
            const prevVal = idx > 0 ? ablations[idx - 1][selectedMetric] : val;
            const delta = val - prevVal;
            const deltaPct = prevVal > 0 ? ((val - prevVal) / prevVal) * 100 : 0;
            const totalDeltaPct = baselineVal > 0 ? ((val - baselineVal) / baselineVal) * 100 : 0;

            const isGoodDelta = config.higherBetter ? delta >= 0 : delta <= 0;

            return (
              <g
                key={a.stage_order}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer transition-all"
              >
                {/* Bar Gradient Background */}
                <rect
                  x={barX}
                  y={yTop}
                  width={barWidth}
                  height={barHeight}
                  fill={isFinalStage ? '#10b981' : config.color}
                  fillOpacity={isHovered ? 0.9 : isFinalStage ? 0.75 : 0.45}
                  stroke={isFinalStage ? '#10b981' : config.color}
                  strokeWidth={isHovered ? 2 : 1.5}
                  rx="4"
                  className="transition-all duration-150"
                />

                {/* Stage Value Label Above Bar */}
                <text
                  x={cx}
                  y={yTop - 8}
                  textAnchor="middle"
                  fill="var(--text-primary)"
                  fontSize="10.5"
                  fontWeight="700"
                >
                  {config.format(val)}
                </text>

                {/* Step Delta Pill (for stages 2+) */}
                {idx > 0 && (
                  <g>
                    <rect
                      x={cx - 24}
                      y={yTop + 8}
                      width={48}
                      height={15}
                      rx="3"
                      fill={isGoodDelta ? '#10b98125' : '#ef444425'}
                      stroke={isGoodDelta ? '#10b981' : '#ef4444'}
                      strokeWidth="0.8"
                    />
                    <text
                      x={cx}
                      y={yTop + 19}
                      textAnchor="middle"
                      fill={isGoodDelta ? 'var(--success)' : 'var(--danger)'}
                      fontSize="8.5"
                      fontWeight="600"
                    >
                      {delta >= 0 ? `+${deltaPct.toFixed(1)}%` : `${deltaPct.toFixed(1)}%`}
                    </text>
                  </g>
                )}

                {/* X Axis Stage Label */}
                <text
                  x={cx}
                  y={padding.top + plotHeight + 18}
                  textAnchor="middle"
                  fill={isHovered ? 'var(--text-primary)' : 'var(--text-secondary)'}
                  fontWeight={isHovered ? '700' : '600'}
                  fontSize="10"
                >
                  Stage {a.stage_order}
                </text>
                <text
                  x={cx}
                  y={padding.top + plotHeight + 32}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="8.5"
                >
                  {a.stage_name.split('(')[0].trim().slice(0, 16)}
                </text>
              </g>
            );
          })}

          {/* Y Axis Label */}
          <text
            transform={`rotate(-90) translate(-${padding.top + plotHeight / 2}, 18)`}
            textAnchor="middle"
            fill="var(--text-secondary)"
            fontSize="11"
            fontWeight="600"
          >
            {config.label} ({config.unit}) {config.higherBetter ? '↑' : '↓'}
          </text>
        </svg>

        {/* Hover Stage Card Tooltip */}
        {hoveredIndex !== null && (
          <div className="absolute top-2 right-2 ws-panel-elevated p-3 text-xs font-mono shadow-md z-20 space-y-1 text-[var(--text-secondary)] max-w-xs">
            <div className="font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-1 flex items-center justify-between">
              <span>
                Stage {ablations[hoveredIndex].stage_order}: {ablations[hoveredIndex].stage_name}
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] font-sans line-clamp-2">
              {ablations[hoveredIndex].description}
            </p>
            <div className="pt-1 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Current Value:</span>
                <strong className="text-[var(--text-primary)]">
                  {config.format(ablations[hoveredIndex][selectedMetric])}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Cumulative Net Shift:</span>
                <strong
                  className={
                    (ablations[hoveredIndex][selectedMetric] - baselineVal) *
                      (config.higherBetter ? 1 : -1) >=
                    0
                      ? 'text-[var(--success)]'
                      : 'text-[var(--danger)]'
                  }
                >
                  {((ablations[hoveredIndex][selectedMetric] - baselineVal) / baselineVal) * 100 >= 0
                    ? `+${(((ablations[hoveredIndex][selectedMetric] - baselineVal) / baselineVal) * 100).toFixed(1)}%`
                    : `${(((ablations[hoveredIndex][selectedMetric] - baselineVal) / baselineVal) * 100).toFixed(1)}%`}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
