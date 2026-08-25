import React, { useState } from 'react';

interface ConvergenceLineChartProps {
  algorithmCurves: Record<string, number[]>; // alg -> array of fitness values
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

export const ConvergenceLineChart: React.FC<ConvergenceLineChartProps> = ({
  algorithmCurves,
  height = 320,
}) => {
  const [selectedAlgs, setSelectedAlgs] = useState<string[]>(Object.keys(algorithmCurves));
  const [hoveredAlg, setHoveredAlg] = useState<string | null>(null);

  const algorithms = Object.keys(algorithmCurves);
  if (algorithms.length === 0) {
    return <div className="lab-card p-6 text-center text-xs text-slate-500">No convergence curves recorded</div>;
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

  const svgWidth = 640;
  const svgHeight = height;
  const padding = { top: 20, right: 30, bottom: 45, left: 60 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const getX = (iter: number) => padding.left + (iter / (maxIters || 1)) * plotWidth;
  const getY = (fit: number) => padding.top + plotHeight - ((fit - minFit) / (maxFit - minFit || 1e-6)) * plotHeight;

  return (
    <div className="lab-card p-4 flex flex-col justify-between">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Convergence Trajectory vs Iteration
          </h4>
          <span className="text-[11px] font-mono text-slate-400">
            Fitness (Objective Cost) Minimization Curve
          </span>
        </div>

        {/* Algorithm Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {algorithms.map((alg) => {
            const isSelected = selectedAlgs.includes(alg);
            const color = ALG_COLORS[alg] || '#94a3b8';
            return (
              <button
                key={alg}
                onClick={() => toggleAlg(alg)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition flex items-center gap-1 border ${
                  isSelected
                    ? 'bg-slate-800 text-slate-100 border-slate-600'
                    : 'bg-slate-900 text-slate-500 border-slate-800 opacity-60'
                }`}
                style={{ borderColor: isSelected ? color : undefined }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                {alg}
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Line Canvas */}
      <div className="relative w-full flex justify-center">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-[720px] overflow-visible font-mono"
        >
          {/* Axis lines */}
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

          {/* Horizontal guides */}
          {[0, 0.5, 1.0].map((t) => {
            const fitVal = minFit + t * (maxFit - minFit);
            const yPos = getY(fitVal);
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
                  {fitVal.toFixed(3)}
                </text>
              </g>
            );
          })}

          {/* Iteration axis marks */}
          {[0, Math.floor(maxIters / 2), maxIters].map((iter) => {
            const xPos = getX(iter);
            return (
              <g key={`x-${iter}`}>
                <line
                  x1={xPos}
                  y1={padding.top + plotHeight}
                  x2={xPos}
                  y2={padding.top + plotHeight + 5}
                  stroke="#64748b"
                />
                <text
                  x={xPos}
                  y={padding.top + plotHeight + 18}
                  textAnchor="middle"
                  fill="#64748b"
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

            const color = ALG_COLORS[alg] || '#3b82f6';
            const isHovered = hoveredAlg === alg;

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
                  strokeWidth={isHovered ? 3.5 : 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={hoveredAlg && !isHovered ? 0.35 : 0.9}
                  className="transition-all duration-150"
                />
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={padding.left + plotWidth / 2}
            y={svgHeight - 6}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="11"
            fontWeight="bold"
          >
            Optimization Iterations &rarr;
          </text>
          <text
            x={-svgHeight / 2}
            y="16"
            transform="rotate(-90)"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="11"
            fontWeight="bold"
          >
            Fitness Cost &rarr; Lower is Better
          </text>
        </svg>
      </div>
    </div>
  );
};
