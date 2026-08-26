import React, { useState } from 'react';

interface BarDataPoint {
  label: string;
  value: number;
  isBaseline?: boolean;
  isBest?: boolean;
  secondaryValue?: number;
}

interface BarChartProps {
  title: string;
  data: BarDataPoint[];
  unit: string;
  isHigherBetter?: boolean;
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  title,
  data,
  unit,
  isHigherBetter = true,
  height = 240,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="ws-panel p-4 text-center text-xs text-[var(--text-muted)] font-mono">No chart data available</div>;
  }

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 0.001);
  const minVal = Math.min(...values, 0);

  return (
    <div className="ws-panel p-5 flex flex-col justify-between space-y-3">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
        <h4 className="ws-section-title">{title}</h4>
        <span className="text-[11px] font-mono text-[var(--text-muted)]">
          Unit: <strong className="text-[var(--text-primary)]">{unit}</strong> ({isHigherBetter ? '↑ Higher Better' : '↓ Lower Better'})
        </span>
      </div>

      <div className="relative w-full" style={{ height: `${height}px` }}>
        {/* Y Axis Guides */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] font-mono text-[var(--text-muted)]">
          <div className="border-b border-[var(--border)] w-full pb-0.5">{maxVal.toFixed(1)}</div>
          <div className="border-b border-[var(--border)] border-dashed w-full pb-0.5">{(maxVal / 2).toFixed(1)}</div>
          <div className="border-b border-[var(--border-strong)] w-full pb-0.5">0.0</div>
        </div>

        {/* Bars Container */}
        <div className="absolute inset-x-8 bottom-4 top-2 flex items-end justify-between gap-2 pt-4">
          {data.map((item, idx) => {
            const heightPct = Math.max(4, Math.min(100, (item.value / maxVal) * 100));
            const isHovered = hoveredIndex === idx;

            let barColor = 'bg-[var(--accent)]';
            if (item.isBaseline) barColor = 'bg-[var(--text-muted)]';
            else if (item.isBest) barColor = isHigherBetter ? 'bg-[var(--success)]' : 'bg-cyan-400';

            return (
              <div
                key={item.label + idx}
                className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-10 z-20 px-2.5 py-1 ws-panel-elevated shadow-lg text-[11px] font-mono whitespace-nowrap text-[var(--text-primary)] pointer-events-none">
                    <strong>{item.label}</strong>: {item.value.toFixed(2)} {unit}
                    {item.isBest && ' (Best)'}
                    {item.isBaseline && ' (Baseline)'}
                  </div>
                )}

                {/* Bar */}
                <div
                  className={`w-full max-w-[28px] rounded-t transition-all duration-150 ${barColor} ${
                    isHovered ? 'brightness-125 scale-y-105' : 'opacity-90'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />

                {/* X Label */}
                <span className={`text-[10px] font-mono mt-1.5 transition ${
                  isHovered ? 'text-[var(--accent)] font-bold' : item.isBest ? 'text-[var(--success)] font-semibold' : 'text-[var(--text-muted)]'
                }`}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
