import React, { useState, useRef, useMemo } from 'react';
import { CnnLayerOperation } from '../../types';
import { Layers, Zap, Cpu, HardDrive, Info } from 'lucide-react';

interface CnnLayerLineChartProps {
  layers: CnnLayerOperation[];
  height?: number;
  onSelectLayer?: (layer: CnnLayerOperation) => void;
  selectedLayerIndex?: number;
}

type MetricKey = 'cumulative_flops_m' | 'cumulative_params_m' | 'activation_memory_kb' | 'flops_pct';

interface MetricConfig {
  key: MetricKey;
  label: string;
  unit: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  formatter: (val: number) => string;
}

const METRIC_CONFIGS: MetricConfig[] = [
  {
    key: 'cumulative_flops_m',
    label: 'Cumulative Compute (FLOPs)',
    unit: 'MFLOPs',
    color: '#00D2FF',
    icon: Zap,
    formatter: (val) => `${val.toFixed(1)} M`,
  },
  {
    key: 'cumulative_params_m',
    label: 'Cumulative Parameters',
    unit: 'M Params',
    color: '#3B82F6',
    icon: Cpu,
    formatter: (val) => `${val.toFixed(3)} M`,
  },
  {
    key: 'activation_memory_kb',
    label: 'Activation Memory Buffer',
    unit: 'KB',
    color: '#10B981',
    icon: HardDrive,
    formatter: (val) => (val >= 1024 ? `${(val / 1024).toFixed(2)} MB` : `${val.toFixed(1)} KB`),
  },
  {
    key: 'flops_pct',
    label: 'Layer Compute Share',
    unit: '% of Total',
    color: '#F59E0B',
    icon: Layers,
    formatter: (val) => `${val.toFixed(2)}%`,
  },
];

export const CnnLayerLineChart: React.FC<CnnLayerLineChartProps> = ({
  layers,
  height = 360,
  onSelectLayer,
  selectedLayerIndex,
}) => {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('cumulative_flops_m');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [useLogScale, setUseLogScale] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const metricConfig = METRIC_CONFIGS.find((m) => m.key === activeMetric) || METRIC_CONFIGS[0];

  // Prepare data points
  const points = useMemo(() => {
    return layers.map((layer, idx) => ({
      index: idx,
      layerNumber: layer.layer_index,
      name: layer.name,
      opType: layer.op_type,
      stage: layer.stage,
      value: Number(layer[activeMetric] ?? 0),
      rawLayer: layer,
    }));
  }, [layers, activeMetric]);

  if (layers.length === 0) {
    return (
      <div className="ws-panel p-8 text-center text-xs font-mono text-[var(--text-muted)]">
        No CNN layer data available to render line graph
      </div>
    );
  }

  // Calculate scales
  let minVal = Infinity;
  let maxVal = -Infinity;

  points.forEach((p) => {
    const v = p.value;
    if (isFinite(v)) {
      minVal = Math.min(minVal, v);
      maxVal = Math.max(maxVal, v);
    }
  });

  if (!isFinite(minVal)) minVal = 0;
  if (!isFinite(maxVal) || maxVal <= minVal) maxVal = minVal + 10;

  // Add 8% padding to max for clean visual headroom
  const valRange = maxVal - minVal;
  const plotMin = useLogScale ? Math.max(0.01, minVal) : Math.max(0, minVal - valRange * 0.05);
  const plotMax = maxVal + valRange * 0.08;

  const svgWidth = 840;
  const svgHeight = height;
  const padding = { top: 25, right: 30, bottom: 45, left: 65 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const getX = (idx: number) => {
    const total = Math.max(1, points.length - 1);
    return padding.left + (idx / total) * plotWidth;
  };

  const getY = (val: number) => {
    if (useLogScale) {
      const logMin = Math.log10(Math.max(1e-4, plotMin));
      const logMax = Math.log10(Math.max(1e-3, plotMax));
      const logVal = Math.log10(Math.max(1e-4, val));
      const ratio = (logVal - logMin) / (logMax - logMin || 1);
      return padding.top + plotHeight - Math.max(0, Math.min(1, ratio)) * plotHeight;
    }
    const ratio = (val - plotMin) / (plotMax - plotMin || 1);
    return padding.top + plotHeight - Math.max(0, Math.min(1, ratio)) * plotHeight;
  };

  // Generate SVG Path
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)},${getY(p.value).toFixed(1)}`)
    .join(' ');

  const areaPath = `${linePath} L ${getX(points.length - 1).toFixed(1)},${(padding.top + plotHeight).toFixed(1)} L ${getX(0).toFixed(1)},${(padding.top + plotHeight).toFixed(1)} Z`;

  // Ticks for Y-Axis
  const numYTicks = 5;
  const yTicks = Array.from({ length: numYTicks }).map((_, i) => {
    const ratio = i / (numYTicks - 1);
    const val = plotMin + ratio * (plotMax - plotMin);
    return { val, y: getY(val) };
  });

  // Ticks for X-Axis (Sampling ~8-10 key layers)
  const stepX = Math.max(1, Math.floor(points.length / 8));
  const xTicks = points.filter((_, i) => i % stepX === 0 || i === points.length - 1);

  // Active hover data
  const currentHovered = hoveredIdx !== null && points[hoveredIdx] ? points[hoveredIdx] : null;
  const activeSelected = selectedLayerIndex !== undefined ? points.find((p) => p.layerNumber === selectedLayerIndex) : null;
  const highlightPoint = currentHovered || activeSelected;

  return (
    <div className="ws-panel p-4 space-y-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xs">
      {/* Metric Selector Tabs & Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {METRIC_CONFIGS.map((cfg) => {
            const Icon = cfg.icon;
            const isSelected = activeMetric === cfg.key;
            return (
              <button
                key={cfg.key}
                onClick={() => setActiveMetric(cfg.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] border border-[var(--border-strong)] shadow-xs font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: isSelected ? cfg.color : undefined }} />
                <span>{cfg.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setUseLogScale(!useLogScale)}
            className={`px-2.5 py-1 text-[11px] font-mono rounded border transition-colors cursor-pointer ${
              useLogScale
                ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)] font-semibold'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title="Toggle Logarithmic Y-axis scale"
          >
            {useLogScale ? 'Scale: LOG₁₀' : 'Scale: LINEAR'}
          </button>
          <span className="text-[10px] font-mono text-[var(--text-muted)] px-1.5 py-0.5 rounded bg-[var(--surface-secondary)] border border-[var(--border)]">
            {layers.length} Layers
          </span>
        </div>
      </div>

      {/* SVG Interactive Chart Viewport */}
      <div className="relative w-full overflow-hidden" ref={containerRef}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoveredIdx(null)}
          onMouseMove={(e) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width;
            const mouseSvgX = relX * svgWidth;
            const plotMouseX = mouseSvgX - padding.left;
            const idx = Math.round((plotMouseX / plotWidth) * (points.length - 1));
            if (idx >= 0 && idx < points.length) {
              setHoveredIdx(idx);
            }
          }}
          onClick={() => {
            if (hoveredIdx !== null && onSelectLayer && points[hoveredIdx]) {
              onSelectLayer(points[hoveredIdx].rawLayer);
            }
          }}
        >
          <defs>
            <linearGradient id={`gradient-${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={metricConfig.color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={metricConfig.color} stopOpacity="0.0" />
            </linearGradient>
            <pattern id="chart-grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--border)" strokeWidth="0.5" strokeOpacity="0.4" />
            </pattern>
          </defs>

          {/* Plot Background & Grid Lines */}
          <rect
            x={padding.left}
            y={padding.top}
            width={plotWidth}
            height={plotHeight}
            fill="none"
          />

          {/* Horizontal Grid Lines & Y-ticks */}
          {yTicks.map((t, idx) => (
            <g key={`y-${idx}`}>
              <line
                x1={padding.left}
                y1={t.y}
                x2={padding.left + plotWidth}
                y2={t.y}
                stroke="var(--border)"
                strokeDasharray="3 3"
                strokeOpacity="0.6"
              />
              <text
                x={padding.left - 8}
                y={t.y + 3.5}
                textAnchor="end"
                className="text-[10px] font-mono fill-[var(--text-muted)]"
              >
                {metricConfig.formatter(t.val)}
              </text>
            </g>
          ))}

          {/* Vertical Grid Lines & X-ticks */}
          {xTicks.map((p) => {
            const x = getX(p.index);
            return (
              <g key={`x-${p.index}`}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + plotHeight}
                  stroke="var(--border)"
                  strokeDasharray="2 4"
                  strokeOpacity="0.4"
                />
                <text
                  x={x}
                  y={padding.top + plotHeight + 16}
                  textAnchor="middle"
                  className="text-[9px] font-mono fill-[var(--text-muted)]"
                >
                  L{p.layerNumber}
                </text>
                <text
                  x={x}
                  y={padding.top + plotHeight + 28}
                  textAnchor="middle"
                  className="text-[8px] font-sans fill-[var(--text-secondary)] truncate"
                  style={{ maxWidth: 40 }}
                >
                  {p.name.length > 9 ? p.name.substring(0, 8) + '…' : p.name}
                </text>
              </g>
            );
          })}

          {/* Shaded Area Under Line */}
          <path d={areaPath} fill={`url(#gradient-${activeMetric})`} />

          {/* Main Line Graph */}
          <path
            d={linePath}
            fill="none"
            stroke={metricConfig.color}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points on Selected Operations (e.g. Conv, Linear) */}
          {points.map((p, idx) => {
            const isSelected = selectedLayerIndex === p.layerNumber;
            const isHovered = hoveredIdx === idx;
            const isMajorOp = ['Conv2d', 'Linear', 'DepthwiseConv2d'].includes(p.opType);

            if (!isSelected && !isHovered && !isMajorOp) return null;

            return (
              <circle
                key={idx}
                cx={getX(idx)}
                cy={getY(p.value)}
                r={isSelected || isHovered ? 5.5 : 2.5}
                fill={isSelected || isHovered ? '#FFFFFF' : metricConfig.color}
                stroke={metricConfig.color}
                strokeWidth={isSelected || isHovered ? 2.5 : 1}
                className="transition-all duration-100"
              />
            );
          })}

          {/* Active Hover Crosshair Line & Highlight Ring */}
          {highlightPoint && (
            <g>
              <line
                x1={getX(highlightPoint.index)}
                y1={padding.top}
                x2={getX(highlightPoint.index)}
                y2={padding.top + plotHeight}
                stroke={metricConfig.color}
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
              <circle
                cx={getX(highlightPoint.index)}
                cy={getY(highlightPoint.value)}
                r="6.5"
                fill="#FFFFFF"
                stroke={metricConfig.color}
                strokeWidth="3"
                className="filter drop-shadow-md animate-pulse"
              />
            </g>
          )}

          {/* Axis Labels */}
          <text
            x={padding.left}
            y={padding.top - 8}
            className="text-[10px] font-mono font-semibold fill-[var(--text-secondary)] uppercase tracking-wider"
          >
            {metricConfig.unit}
          </text>
          <text
            x={padding.left + plotWidth}
            y={padding.top + plotHeight + 40}
            textAnchor="end"
            className="text-[10px] font-mono fill-[var(--text-muted)] uppercase tracking-wider"
          >
            Layer Progression &rarr;
          </text>
        </svg>

        {/* Live Hover Tooltip Card Floating Over Chart */}
        {highlightPoint && (
          <div
            className="absolute top-2 right-2 bg-[var(--surface-elevated)]/95 backdrop-blur-md border border-[var(--border-strong)] p-3 rounded-lg shadow-xl text-xs font-mono max-w-xs space-y-1.5 pointer-events-none transition-all"
          >
            <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-1.5">
              <span className="font-bold text-[var(--text-primary)]">
                #{highlightPoint.layerNumber} &bull; {highlightPoint.name}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--accent)] font-semibold border border-[var(--border)]">
                {highlightPoint.opType}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <div>
                <span className="text-[var(--text-muted)]">Stage:</span>{' '}
                <span className="text-[var(--text-secondary)]">{highlightPoint.stage}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">{metricConfig.label}:</span>{' '}
                <span className="font-bold" style={{ color: metricConfig.color }}>
                  {metricConfig.formatter(highlightPoint.value)}
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">FLOPs:</span>{' '}
                <span className="text-[var(--text-primary)] font-bold">
                  {(highlightPoint.rawLayer.flops / 1e6).toFixed(2)} M
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Params:</span>{' '}
                <span className="text-[var(--text-primary)] font-bold">
                  {(highlightPoint.rawLayer.total_params / 1e3).toFixed(1)} k
                </span>
              </div>
            </div>

            <div className="pt-1 text-[9px] text-[var(--text-muted)] flex items-center gap-1 border-t border-[var(--border)]/60">
              <Info className="w-3 h-3 text-[var(--accent)]" />
              <span>Click point or row below to view step-by-step arithmetic</span>
            </div>
          </div>
        )}
      </div>

      {/* Trajectory Footnote & Quick Summary */}
      <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-[var(--text-muted)] pt-1 border-t border-[var(--border)]/50">
        <span>
          Crosshair shows cumulative compute progression through depth &bull; Click to isolate layer
        </span>
        <span className="text-[var(--text-secondary)]">
          Total Model Compute:{' '}
          <strong className="text-[var(--accent)]">
            {(layers[layers.length - 1]?.cumulative_flops_m || 0).toFixed(1)} MFLOPs
          </strong>
        </span>
      </div>
    </div>
  );
};
