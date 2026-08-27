import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, TrendingDown, Eye, CheckSquare, Square } from 'lucide-react';

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
  height = 370,
}) => {
  const algorithms = Object.keys(algorithmCurves);
  const [selectedAlgs, setSelectedAlgs] = useState<string[]>(algorithms);
  const [hoveredAlg, setHoveredAlg] = useState<string | null>(null);
  const [useLogScale, setUseLogScale] = useState<boolean>(false);

  // Find max iterations across curves
  let maxIters = 1;
  algorithms.forEach((alg) => {
    const curve = algorithmCurves[alg] || [];
    maxIters = Math.max(maxIters, curve.length - 1);
  });

  // Real-time Playback / Scrubber State
  const [currentStep, setCurrentStep] = useState<number>(maxIters);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    setCurrentStep(maxIters);
  }, [maxIters]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= maxIters) {
            setIsPlaying(false);
            return maxIters;
          }
          return prev + 1;
        });
      }, 150);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, maxIters]);

  if (algorithms.length === 0) {
    return (
      <div className="ws-panel p-6 text-center text-xs text-[var(--text-muted)] font-mono">
        No convergence curves recorded
      </div>
    );
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

  const handleSelectAll = () => setSelectedAlgs(algorithms);
  const handleSelectTop3 = () => setSelectedAlgs(algorithms.slice(0, 3));

  // Compute min/max fitness for visible algorithms up to currentStep
  let minFit = Infinity;
  let maxFit = -Infinity;

  selectedAlgs.forEach((alg) => {
    const curve = algorithmCurves[alg] || [];
    curve.slice(0, currentStep + 1).forEach((val) => {
      minFit = Math.min(minFit, val);
      maxFit = Math.max(maxFit, val);
    });
  });

  if (minFit === Infinity) minFit = 0.001;
  if (maxFit === -Infinity) maxFit = 1.0;

  const range = Math.max(0.001, maxFit - minFit);
  const padDelta = range * 0.12;
  const plotMin = Math.max(0.0001, minFit - padDelta);
  const plotMax = maxFit + padDelta;

  const svgWidth = 740;
  const svgHeight = height;
  const padding = { top: 25, right: 35, bottom: 48, left: 70 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const getX = (iter: number) => padding.left + (iter / (maxIters || 1)) * plotWidth;

  const getY = (fit: number) => {
    if (useLogScale) {
      const logMin = Math.log10(Math.max(1e-5, plotMin));
      const logMax = Math.log10(Math.max(1e-4, plotMax));
      const logVal = Math.log10(Math.max(1e-5, fit));
      return padding.top + plotHeight - ((logVal - logMin) / (logMax - logMin || 1e-6)) * plotHeight;
    }
    return padding.top + plotHeight - ((fit - plotMin) / (plotMax - plotMin || 1e-6)) * plotHeight;
  };

  return (
    <div className="ws-panel p-5 space-y-4">
      {/* Header & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)]">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div>
            <h4 className="ws-section-title">
              Dynamic Convergence Trajectories &amp; Step Evolution
            </h4>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              Multi-Objective Cost Fitness Minimization &bull; Iteration {currentStep} / {maxIters}
            </span>
          </div>
        </div>

        {/* Real-time Playback / Scale Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Play / Pause / Reset */}
          <div className="flex items-center gap-1 bg-[var(--surface-secondary)] p-1 rounded-md border border-[var(--border)]">
            <button
              onClick={() => {
                if (currentStep >= maxIters) setCurrentStep(0);
                setIsPlaying(!isPlaying);
              }}
              className="px-2 py-1 rounded bg-[var(--surface-elevated)] hover:bg-[var(--accent)] hover:text-white text-[var(--text-primary)] transition flex items-center gap-1 text-[11px]"
              title={isPlaying ? 'Pause' : 'Play animation'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep(0);
              }}
              className="p-1 rounded hover:bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="Reset to Iteration 0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep(maxIters);
              }}
              className="px-1.5 py-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="Jump to End"
            >
              End
            </button>
          </div>

          {/* Log / Linear Scale Toggle */}
          <button
            onClick={() => setUseLogScale(!useLogScale)}
            className={`px-2.5 py-1 rounded border text-[11px] transition ${
              useLogScale
                ? 'bg-[var(--accent)] text-white border-[var(--accent)] font-semibold'
                : 'bg-[var(--surface-secondary)] text-[var(--text-muted)] border-[var(--border)]'
            }`}
          >
            {useLogScale ? 'Log10 Scale' : 'Linear Scale'}
          </button>
        </div>
      </div>

      {/* Algorithm Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono pt-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {algorithms.map((alg) => {
            const isSelected = selectedAlgs.includes(alg);
            const color = ALG_COLORS[alg] || 'var(--accent)';
            return (
              <button
                key={alg}
                onClick={() => toggleAlg(alg)}
                onMouseEnter={() => setHoveredAlg(alg)}
                onMouseLeave={() => setHoveredAlg(null)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all flex items-center gap-1.5 border cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] border-[var(--accent)] font-semibold shadow-sm'
                    : 'bg-[var(--surface-secondary)] text-[var(--text-muted)] border-[var(--border)] opacity-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span>{alg}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <button onClick={handleSelectAll} className="hover:text-[var(--accent)] underline">
            All
          </button>
          <span>&bull;</span>
          <button onClick={handleSelectTop3} className="hover:text-[var(--accent)] underline">
            Top 3
          </button>
        </div>
      </div>

      {/* Step Scrubber Slider */}
      <div className="flex items-center gap-3 px-1 py-1 font-mono text-xs text-[var(--text-secondary)]">
        <span className="text-[11px] text-[var(--text-muted)] shrink-0">Iter Scrubber:</span>
        <input
          type="range"
          min="0"
          max={maxIters}
          value={currentStep}
          onChange={(e) => {
            setIsPlaying(false);
            setCurrentStep(parseInt(e.target.value));
          }}
          className="w-full accent-[var(--accent)] cursor-pointer h-1.5 rounded-lg bg-[var(--surface-secondary)]"
        />
        <span className="text-[11px] font-bold text-[var(--accent)] shrink-0">
          Step {currentStep}/{maxIters}
        </span>
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

          {/* Active scrubber vertical cursor */}
          <line
            x1={getX(currentStep)}
            y1={padding.top}
            x2={getX(currentStep)}
            y2={padding.top + plotHeight}
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            opacity="0.8"
          />

          {/* Convergence Lines for Selected Algorithms up to currentStep */}
          {selectedAlgs.map((alg) => {
            const fullCurve = algorithmCurves[alg] || [];
            const curve = fullCurve.slice(0, currentStep + 1);
            if (curve.length === 0) return null;

            const pathD = curve
              .map((fit, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(fit)}`)
              .join(' ');

            const color = ALG_COLORS[alg] || 'var(--accent)';
            const isHovered = hoveredAlg === alg;
            const lastIndex = curve.length - 1;
            const currentFit = curve[lastIndex];
            const endX = getX(lastIndex);
            const endY = getY(currentFit);

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
                  opacity={hoveredAlg && !isHovered ? 0.25 : 0.95}
                  className="transition-all duration-100"
                />

                {/* Animated Current Head Marker */}
                <circle
                  cx={endX}
                  cy={endY}
                  r={isHovered ? 5.5 : 4}
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
            Optimization Search Progress (Iterations &rarr;)
          </text>
          <text
            transform={`rotate(-90) translate(-${padding.top + plotHeight / 2}, 18)`}
            textAnchor="middle"
            fill="var(--text-secondary)"
            fontSize="11"
            fontWeight="600"
          >
            Multi-Objective Cost Fitness (Lower is Better &rarr;)
          </text>
        </svg>

        {/* Hover / Current Summary Card */}
        {hoveredAlg && algorithmCurves[hoveredAlg] && (
          <div className="absolute top-2 right-2 ws-panel-elevated p-3 text-xs font-mono shadow-lg z-20 space-y-1 text-[var(--text-secondary)]">
            <div className="font-bold text-[var(--text-primary)] flex items-center justify-between gap-3 border-b border-[var(--border)] pb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ALG_COLORS[hoveredAlg] || 'var(--accent)' }} />
                <span>{hoveredAlg}</span>
              </span>
              <span className="text-[10px] text-[var(--accent)] font-semibold">Iter {currentStep}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Initial Cost:</span>
              <strong className="text-[var(--text-primary)]">{algorithmCurves[hoveredAlg][0].toFixed(4)}</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Current Cost:</span>
              <strong className="text-[var(--success)]">{algorithmCurves[hoveredAlg][Math.min(currentStep, algorithmCurves[hoveredAlg].length - 1)].toFixed(4)}</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Final Best Cost:</span>
              <strong className="text-emerald-400">{algorithmCurves[hoveredAlg][algorithmCurves[hoveredAlg].length - 1].toFixed(4)}</strong>
            </div>
            <div className="flex justify-between gap-4 border-t border-[var(--border)] pt-1">
              <span>Cost Drop:</span>
              <strong className="text-[var(--accent)]">
                {(
                  ((algorithmCurves[hoveredAlg][0] -
                    algorithmCurves[hoveredAlg][Math.min(currentStep, algorithmCurves[hoveredAlg].length - 1)]) /
                    algorithmCurves[hoveredAlg][0]) *
                  100
                ).toFixed(1)}%
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
