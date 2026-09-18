import React, { useState, useRef } from 'react';
import { ThermalPoint } from '../../types';
import { Flame, ShieldAlert, ShieldCheck, Thermometer } from 'lucide-react';

interface ThermalLineChartProps {
  thermalCurve: ThermalPoint[];
  skinContactLimitC: number;
  ambientTempC: number;
  operatingTempC: number;
  deviceName: string;
  height?: number;
}

export const ThermalLineChart: React.FC<ThermalLineChartProps> = ({
  thermalCurve,
  skinContactLimitC = 43.0,
  ambientTempC = 25.0,
  operatingTempC = 38.0,
  deviceName = 'Smartwatch',
  height = 320,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!thermalCurve || thermalCurve.length === 0) {
    return (
      <div className="ws-panel p-6 text-center text-xs font-mono text-[var(--text-muted)]">
        No thermal curve data available
      </div>
    );
  }

  const minTemp = ambientTempC - 2.0;
  const maxTemp = Math.max(operatingTempC + 6.0, skinContactLimitC + 8.0);
  const tempRange = maxTemp - minTemp;

  const maxTime = thermalCurve[thermalCurve.length - 1].time_seconds || 60;

  const svgWidth = 720;
  const svgHeight = height;
  const padding = { top: 25, right: 35, bottom: 45, left: 60 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const getX = (timeS: number) => padding.left + (timeS / maxTime) * plotWidth;
  const getY = (tempC: number) => {
    const ratio = (tempC - minTemp) / (tempRange || 1);
    return padding.top + plotHeight - Math.max(0, Math.min(1, ratio)) * plotHeight;
  };

  const linePath = thermalCurve
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.time_seconds).toFixed(1)},${getY(p.temperature_c).toFixed(1)}`)
    .join(' ');

  const areaPath = `${linePath} L ${getX(maxTime).toFixed(1)},${(padding.top + plotHeight).toFixed(1)} L ${getX(0).toFixed(1)},${(padding.top + plotHeight).toFixed(1)} Z`;

  const limitY = getY(skinContactLimitC);
  const isOverheating = operatingTempC > skinContactLimitC;
  const isNearLimit = operatingTempC >= skinContactLimitC - 3.0 && !isOverheating;

  // Y-axis ticks
  const yTicks = [minTemp, ambientTempC, 35, 40, skinContactLimitC, 50, maxTemp]
    .filter((v, idx, arr) => arr.indexOf(v) === idx && v >= minTemp && v <= maxTemp)
    .sort((a, b) => a - b);

  const hoveredPoint = hoveredIdx !== null && thermalCurve[hoveredIdx] ? thermalCurve[hoveredIdx] : null;

  return (
    <div className="ws-panel p-4 space-y-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xs">
      {/* Header & Thermal Status Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-2.5">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg border flex items-center justify-center ${
              isOverheating
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : isNearLimit
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
          >
            {isOverheating ? (
              <Flame className="w-4 h-4 animate-bounce" />
            ) : isNearLimit ? (
              <ShieldAlert className="w-4 h-4" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-[var(--text-primary)] font-mono uppercase tracking-wider flex items-center gap-1.5">
              <span>Thermal Dissipation &amp; Heat Saturation Curve &bull; {deviceName}</span>
            </h4>
            <p className="text-[11px] text-[var(--text-muted)] font-mono">
              T(t) = T_ambient + P · R_th · (1 - e^(-t/τ)) &bull; Skin Contact Limit: {skinContactLimitC}°C
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
              isOverheating
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                : isNearLimit
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
            }`}
          >
            {isOverheating ? 'OVERHEATING THRESHOLD EXCEEDED' : isNearLimit ? 'ELEVATED WARMTH' : 'SKIN CONTACT SAFE'}
          </span>
          <span className="text-xs font-mono font-bold text-[var(--text-primary)] px-2 py-0.5 rounded bg-[var(--surface-secondary)] border border-[var(--border)]">
            Steady State: <strong className={isOverheating ? 'text-rose-400' : 'text-[var(--accent)]'}>{operatingTempC}°C</strong>
          </span>
        </div>
      </div>

      {/* SVG Plot */}
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
            const idx = Math.round((plotMouseX / plotWidth) * (thermalCurve.length - 1));
            if (idx >= 0 && idx < thermalCurve.length) {
              setHoveredIdx(idx);
            }
          }}
        >
          <defs>
            <linearGradient id="thermal-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isOverheating ? '#F43F5E' : '#00D2FF'} stopOpacity="0.25" />
              <stop offset="100%" stopColor={isOverheating ? '#F43F5E' : '#00D2FF'} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((yVal, i) => (
            <g key={`y-${i}`}>
              <line
                x1={padding.left}
                y1={getY(yVal)}
                x2={padding.left + plotWidth}
                y2={getY(yVal)}
                stroke="var(--border)"
                strokeDasharray="3 3"
                strokeOpacity="0.5"
              />
              <text
                x={padding.left - 8}
                y={getY(yVal) + 3.5}
                textAnchor="end"
                className="text-[9px] font-mono fill-[var(--text-muted)]"
              >
                {yVal.toFixed(0)}°C
              </text>
            </g>
          ))}

          {/* Time X-axis ticks */}
          {thermalCurve.map((p) => {
            const x = getX(p.time_seconds);
            return (
              <g key={`x-${p.time_seconds}`}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + plotHeight}
                  stroke="var(--border)"
                  strokeDasharray="2 4"
                  strokeOpacity="0.3"
                />
                <text
                  x={x}
                  y={padding.top + plotHeight + 16}
                  textAnchor="middle"
                  className="text-[9px] font-mono fill-[var(--text-muted)]"
                >
                  {p.time_seconds}s
                </text>
              </g>
            );
          })}

          {/* Critical Skin Safety Limit Reference Line (43°C) */}
          <line
            x1={padding.left}
            y1={limitY}
            x2={padding.left + plotWidth}
            y2={limitY}
            stroke="#F43F5E"
            strokeWidth="1.8"
            strokeDasharray="5 3"
          />
          <text
            x={padding.left + plotWidth - 6}
            y={limitY - 6}
            textAnchor="end"
            className="text-[9px] font-mono font-bold fill-rose-400"
          >
            IEC 62368-1 Skin Safety Limit (43°C)
          </text>

          {/* Shaded Area Under Curve */}
          <path d={areaPath} fill="url(#thermal-gradient)" />

          {/* Thermal Rise Curve Path */}
          <path
            d={linePath}
            fill="none"
            stroke={isOverheating ? '#F43F5E' : '#00D2FF'}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Points along curve */}
          {thermalCurve.map((p, idx) => (
            <circle
              key={idx}
              cx={getX(p.time_seconds)}
              cy={getY(p.temperature_c)}
              r={hoveredIdx === idx ? 6 : 3}
              fill={p.temperature_c > skinContactLimitC ? '#F43F5E' : '#00D2FF'}
              stroke="#FFFFFF"
              strokeWidth={hoveredIdx === idx ? 2.5 : 1}
              className="transition-all"
            />
          ))}

          {/* Hover Crosshair */}
          {hoveredPoint && (
            <g>
              <line
                x1={getX(hoveredPoint.time_seconds)}
                y1={padding.top}
                x2={getX(hoveredPoint.time_seconds)}
                y2={padding.top + plotHeight}
                stroke={isOverheating ? '#F43F5E' : '#00D2FF'}
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
            </g>
          )}

          {/* Labels */}
          <text
            x={padding.left}
            y={padding.top - 8}
            className="text-[10px] font-mono font-semibold fill-[var(--text-secondary)] uppercase tracking-wider"
          >
            Temperature (°C)
          </text>
          <text
            x={padding.left + plotWidth}
            y={padding.top + plotHeight + 35}
            textAnchor="end"
            className="text-[10px] font-mono fill-[var(--text-muted)] uppercase tracking-wider"
          >
            Continuous Execution Time &rarr;
          </text>
        </svg>

        {/* Hover Point Card */}
        {hoveredPoint && (
          <div className="absolute top-2 right-2 bg-[var(--surface-elevated)]/95 backdrop-blur-md border border-[var(--border-strong)] p-2.5 rounded-lg shadow-xl text-xs font-mono space-y-1 pointer-events-none">
            <div className="flex justify-between items-center gap-4">
              <span className="text-[var(--text-muted)]">Time:</span>
              <strong className="text-[var(--text-primary)]">{hoveredPoint.time_seconds} s</strong>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-[var(--text-muted)]">Temperature:</span>
              <strong className={hoveredPoint.temperature_c > skinContactLimitC ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                {hoveredPoint.temperature_c}°C
              </strong>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-[var(--text-muted)]">Rise above ambient:</span>
              <span className="text-[var(--accent)] font-semibold">+{hoveredPoint.delta_c}°C</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Notes */}
      <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-[var(--text-muted)] pt-1 border-t border-[var(--border)]/60">
        <span>
          Enclosure Thermal Resistance: <strong>{deviceName}</strong> &bull; Ambient Temp: <strong>{ambientTempC}°C</strong>
        </span>
        <span>
          Safety Criterion: Wearable surface temperature must remain below 43°C to avoid tissue hyperthermia
        </span>
      </div>
    </div>
  );
};
