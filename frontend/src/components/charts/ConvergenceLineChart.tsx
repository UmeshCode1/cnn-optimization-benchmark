import React, { useState } from 'react';

interface ConvergenceLineChartProps {
  algorithmCurves: Record<string, number[]>; // alg -> array of fitness values
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

export const ConvergenceLineChart: React.FC<ConvergenceLineChartProps> = ({
  algorithmCurves,
  height = 360,
}) => {
  const [selectedAlgs, setSelectedAlgs] = useState<string[]>(Object.keys(algorithmCurves));
  const [hoveredAlg, setHoveredAlg] = useState<string | null>(null);

  const algorithms = Object.keys(algorithmCurves);
  if (algorithms.length === 0) {
    return <div className="ws-panel p-6 text-center text-xs text-[var(--text-muted)] font-mono">No convergence curves recorded</div>;
  }

  const toggleAlg = (alg: string) => {
    if (selectedAlgs.includes(alg)) {
      if (selectedAlgs.length > 1) {
        setSelectedAlgs(selectedAlgs.filter((a) => a !== alg));
      }
    } else {
      setSelectedAlgs([...selectedAlgs, alg]);
    }
  };

  // Find max iterations and min/max fitness
  let maxIters = 1;
  let minFit = Infinity;
  let maxFit = -Infinity;

  selectedAlgs.forEach((alg) => {
    const curve = algorithmCurves[alg] || [];
    maxIters = Math.max(maxIters, curve.length - 1);
    curve.forEach((val) => {
      minFit = Math.min(minFit, val);
      maxFit = Math.max(maxFit, val);
    });
  });

  if (minFit === Infinity) minFit = 0;
  if (maxFit === -Infinity) maxFit = 1.0;

  const range = Math.max(0.001, maxFit - minFit);
  const padDelta = range * 0.12;
  const plotMin = Math.max(0, minFit - padDelta);
  const plotMax = maxFit + padDelta;

  const svgWidth = 720;
  const svgHeight = height;
  const padding = { top: 25, right: 30, bottom: 45, left: 65 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const getX = (iter: number) => padding.left + (iter / (maxIters || 1)) * plotWidth;
  const getY = (fit: number) => padding.top + plotHeight - ((fit - plotMin) / (plotMax - plotMin || 1e-6)) * plotHeight;

  return (
    <div className="ws-panel p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div>
          <h4 className="ws-section-title">
            Convergence Trajectory vs Iteration
          </h4>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            Fitness (Objective Cost) Minimization Curve &bull; Lower is Better
          </span>
        </div>

        {/* Algorithm Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          {algorithms.map((alg) => {
            const isSelected = selectedAlgs.includes(alg);
            const color = ALG_COLORS[alg] || 'var(--accent)';
            return (
              <button
                key={alg}
                onClick={() => toggleAlg(alg)}
                onMouseEnter={() => setHoveredAlg(alg)}
                onMouseLeave={() => setHoveredAlg(null)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] border-[var(--accent)] font-semibold shadow-sm'
                    : 'bg-[var(--surface-secondary)] text-[var(--text-muted)] border-[var(--border)] opacity-60'
                }`}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span>{alg}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Line Canvas */}
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
            const fitVal = plotMin + t * (plotMax - plotMin);
            const yPos = getY(fitVal);
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
                  {fitVal.toFixed(range < 0.1 ? 4 : 3)}
                </text>
              </g>
            );
          })}

          {/* Iteration axis marks */}
          {[0, Math.floor(maxIters / 4), Math.floor(maxIters / 2), Math.floor((3 * maxIters) / 4), maxIters].map((iter) => {
            const xPos = getX(iter);
            return (
              <g key={`x-${iter}`}>
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
                  Iter {iter}
                </text>
              </g>
            );
          })}

          {/* Convergence Lines for Selected Algorithms */}
          {selectedAlgs.map((alg) => {
            const curve = algorithmCurves[alg] || [];
            if (curve.length === 0) return null;

            const pathD = curve
              .map((fit, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(fit)}`)
              .join(' ');

            const color = ALG_COLORS[alg] || 'var(--accent)';
            const isHovered = hoveredAlg === alg;
            const lastIter = curve.length - 1;
            const finalFit = curve[lastIter];
            const endX = getX(lastIter);
            const endY = getY(finalFit);

            return (
              <g
                key={alg}
                onMouseEnter={() => setHoveredAlg(alg)}
                onMouseLeave={() => setHoveredAlg(null)}
                className="cursor-pointer"
              >
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth={isHovered ? 3 : 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={hoveredAlg && !isHovered ? 0.25 : 0.95}
                  className="transition-all duration-150"
                />

                {/* Final Best Fitness Endpoint Marker */}
                <circle
                  cx={endX}
                  cy={endY}
                  r={isHovered ? 5 : 3.5}
                  fill={color}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={padding.left + plotWidth / 2}
            y={padding.top + plotHeight + 36}
            textAnchor="middle"
            fill="var(--text-secondary)"
            fontSize="11"
            fontWeight="600"
          >
            Optimization Iterations (Search Progress &rarr;)
          </text>
          <text
            transform={`rotate(-90) translate(-${padding.top + plotHeight / 2}, 18)`}
            textAnchor="middle"
            fill="var(--text-secondary)"
            fontSize="11"
            fontWeight="600"
          >
            Objective Cost Fitness (Lower is Better &rarr;)
          </text>
        </svg>

        {/* Hover Summary Card */}
        {hoveredAlg && algorithmCurves[hoveredAlg] && (
          <div className="absolute top-2 right-2 ws-panel-elevated p-2.5 text-xs font-mono shadow-md z-20 space-y-1 text-[var(--text-secondary)]">
            <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5 border-b border-[var(--border)] pb-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ALG_COLORS[hoveredAlg] || 'var(--accent)' }} />
              <span>{hoveredAlg}</span>
            </div>
            <div>Initial Cost: <strong>{algorithmCurves[hoveredAlg][0].toFixed(4)}</strong></div>
            <div>Final Best Cost: <strong className="text-[var(--success)]">{algorithmCurves[hoveredAlg][algorithmCurves[hoveredAlg].length - 1].toFixed(4)}</strong></div>
            <div>Reduction: <strong className="text-[var(--accent)]">{(((algorithmCurves[hoveredAlg][0] - algorithmCurves[hoveredAlg][algorithmCurves[hoveredAlg].length - 1]) / algorithmCurves[hoveredAlg][0]) * 100).toFixed(1)}%</strong></div>
          </div>
        )}
      </div>
    </div>
  );
};
