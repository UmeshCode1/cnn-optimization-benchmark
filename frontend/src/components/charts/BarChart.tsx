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
    return <div className="lab-card p-4 text-center text-xs text-slate-500">No chart data available</div>;
  }

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 0.001);
  const minVal = Math.min(...values, 0);

  return (
    <div className="lab-card p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">{title}</h4>
        <span className="text-[11px] font-mono text-slate-400">
          Unit: <strong className="text-slate-200">{unit}</strong> ({isHigherBetter ? '↑ Higher Better' : '↓ Lower Better'})
        </span>
      </div>

      <div className="relative w-full" style={{ height: `${height}px` }}>
        {/* Y Axis Guides */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] font-mono text-slate-400">
          <div className="border-b border-slate-800/80 w-full pb-0.5">{maxVal.toFixed(1)}</div>
          <div className="border-b border-slate-800/40 w-full pb-0.5">{(maxVal / 2).toFixed(1)}</div>
          <div className="border-b border-slate-800 w-full pb-0.5">0.0</div>
        </div>

        {/* Bars Container */}
        <div className="absolute inset-x-8 bottom-4 top-2 flex items-end justify-between gap-1.5 pt-4">
          {data.map((item, idx) => {
            const heightPct = Math.max(4, Math.min(100, (item.value / maxVal) * 100));
            const isHovered = hoveredIndex === idx;

            let barColor = 'bg-blue-600';
            if (item.isBaseline) barColor = 'bg-slate-600';
            else if (item.isBest) barColor = isHigherBetter ? 'bg-emerald-500' : 'bg-cyan-400';

            return (
              <div
                key={item.label + idx}
                className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-10 z-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded shadow-lg text-[11px] font-mono whitespace-nowrap text-slate-200 pointer-events-none">
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
                  isHovered ? 'text-blue-400 font-bold' : item.isBest ? 'text-emerald-400 font-semibold' : 'text-slate-400'
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
