import React, { useState, useMemo } from 'react';
import { Sliders, RotateCcw, HelpCircle, Check, ArrowUpDown, ChevronDown, ChevronUp, Layers, Zap, Cpu } from 'lucide-react';
import { RankedAlgorithm, ParetoPoint } from '../../types';

interface AlgorithmComparisonWorkbenchProps {
  rankedAlgorithms: RankedAlgorithm[];
  paretoPoints: ParetoPoint[];
  initialSelectedKeys?: string[];
  onSelectAlgorithm?: (key: string) => void;
}

export const AlgorithmComparisonWorkbench: React.FC<AlgorithmComparisonWorkbenchProps> = ({
  rankedAlgorithms,
  paretoPoints,
  initialSelectedKeys,
  onSelectAlgorithm,
}) => {
  // Objective Weight State
  const defaultWeights = {
    accuracy: 0.40,
    latency: 0.25,
    size: 0.20,
    energy: 0.15,
  };

  const [weights, setWeights] = useState(defaultWeights);
  const [showWeightSliders, setShowWeightSliders] = useState(false);
  const [selectedAlgs, setSelectedAlgs] = useState<string[]>(() => {
    if (initialSelectedKeys && initialSelectedKeys.length > 0) return initialSelectedKeys;
    return rankedAlgorithms.map((a) => a.algorithm);
  });
  const [expandedExplanation, setExpandedExplanation] = useState<string | null>(null);

  // Recalculate normalized rankings live based on adjusted objective weights
  const recalculatedAlgorithms = useMemo(() => {
    if (!rankedAlgorithms || rankedAlgorithms.length === 0) return [];

    const minLat = Math.min(...rankedAlgorithms.map((a) => a.latency_ms));
    const maxLat = Math.max(...rankedAlgorithms.map((a) => a.latency_ms));
    const minSize = Math.min(...rankedAlgorithms.map((a) => a.model_size_mb));
    const maxSize = Math.max(...rankedAlgorithms.map((a) => a.model_size_mb));
    const minEnergy = Math.min(...rankedAlgorithms.map((a) => a.energy_j));
    const maxEnergy = Math.max(...rankedAlgorithms.map((a) => a.energy_j));

    const totalWeight = weights.accuracy + weights.latency + weights.size + weights.energy || 1.0;
    const normW_acc = weights.accuracy / totalWeight;
    const normW_lat = weights.latency / totalWeight;
    const normW_size = weights.size / totalWeight;
    const normW_energy = weights.energy / totalWeight;

    const computed = rankedAlgorithms.map((alg) => {
      const normAcc = alg.accuracy / 100.0;
      const normLat = maxLat > minLat ? 1.0 - (alg.latency_ms - minLat) / (maxLat - minLat) : 1.0;
      const normSize = maxSize > minSize ? 1.0 - (alg.model_size_mb - minSize) / (maxSize - minSize) : 1.0;
      const normEnergy = maxEnergy > minEnergy ? 1.0 - (alg.energy_j - minEnergy) / (maxEnergy - minEnergy) : 1.0;

      const dynamicScore = (
        normW_acc * normAcc +
        normW_lat * normLat +
        normW_size * normSize +
        normW_energy * normEnergy
      ) * 100.0;

      // Check Pareto membership
      const isPareto =
        alg.is_pareto ||
        alg.is_pareto_optimal ||
        paretoPoints.some((p) => p.algorithm === alg.algorithm && (p.is_pareto || (p as any).is_pareto_optimal));

      // Calculate power and TOPs
      const powerW = alg.power_w || (alg.energy_j / Math.max(0.0001, alg.latency_ms * 0.001));
      const flopsM = alg.flops_m || (alg.parameters_m ? alg.parameters_m * 50 : 330.0);
      const topsVal = (flopsM * 1e6) / (Math.max(0.001, alg.latency_ms) * 1e-3 * 1e12);

      return {
        ...alg,
        flops_m: flopsM,
        power_w: powerW,
        tops: topsVal,
        dynamicScore: Math.max(0, Math.min(100, dynamicScore)),
        isPareto,
      };
    });

    computed.sort((a, b) => b.dynamicScore - a.dynamicScore);
    return computed.map((alg, index) => ({ ...alg, dynamicRank: index + 1 }));
  }, [rankedAlgorithms, paretoPoints, weights]);

  const toggleAlgorithm = (key: string) => {
    setSelectedAlgs((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  };

  const isCustomWeights = (
    weights.accuracy !== defaultWeights.accuracy ||
    weights.latency !== defaultWeights.latency ||
    weights.size !== defaultWeights.size ||
    weights.energy !== defaultWeights.energy
  );

  const activeCompareList = recalculatedAlgorithms.filter((a) => selectedAlgs.includes(a.algorithm));

  return (
    <div className="ws-panel p-5 space-y-4">
      {/* Top Header & Objective Weight Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="ws-section-title">Algorithm Comparison Workbench</h3>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              ({selectedAlgs.length}/{rankedAlgorithms.length} Selected)
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Compare multi-objective trade-offs side-by-side with transparent weight sensitivity and power/compute profiling.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWeightSliders(!showWeightSliders)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer ${
              showWeightSliders || isCustomWeights
                ? 'bg-[var(--surface-elevated)] border-[var(--accent)] text-[var(--accent)]'
                : 'ws-button-secondary text-[var(--text-secondary)]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Objective Weights ({((weights.accuracy)*100).toFixed(0)}/{(weights.latency*100).toFixed(0)}/{(weights.size*100).toFixed(0)}/{(weights.energy*100).toFixed(0)})</span>
          </button>

          {isCustomWeights && (
            <button
              onClick={() => setWeights(defaultWeights)}
              className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Reset to default research weights (40/25/20/15)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Objective Weight Slider Tray */}
      {showWeightSliders && (
        <div className="p-3.5 bg-[var(--surface-secondary)] rounded-md border border-[var(--border)] space-y-3 text-xs animate-fade-in">
          <div className="flex items-center justify-between font-mono">
            <span className="font-semibold text-[var(--text-primary)]">Dynamic Objective Weighting</span>
            <span className="text-[var(--text-muted)] text-[11px]">
              Ranking recalculates in real time based on active weights.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono">
            <div>
              <div className="flex justify-between mb-1 text-[11px]">
                <span className="text-[var(--text-secondary)]">Accuracy:</span>
                <span className="font-semibold text-[var(--text-primary)]">{(weights.accuracy * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.05"
                value={weights.accuracy}
                onChange={(e) => setWeights({ ...weights, accuracy: parseFloat(e.target.value) })}
                className="w-full accent-[var(--accent)] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1 text-[11px]">
                <span className="text-[var(--text-secondary)]">Latency:</span>
                <span className="font-semibold text-[var(--text-primary)]">{(weights.latency * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.05"
                value={weights.latency}
                onChange={(e) => setWeights({ ...weights, latency: parseFloat(e.target.value) })}
                className="w-full accent-[var(--accent)] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1 text-[11px]">
                <span className="text-[var(--text-secondary)]">Model Size:</span>
                <span className="font-semibold text-[var(--text-primary)]">{(weights.size * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.05"
                value={weights.size}
                onChange={(e) => setWeights({ ...weights, size: parseFloat(e.target.value) })}
                className="w-full accent-[var(--accent)] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1 text-[11px]">
                <span className="text-[var(--text-secondary)]">Energy:</span>
                <span className="font-semibold text-[var(--text-primary)]">{(weights.energy * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.05"
                value={weights.energy}
                onChange={(e) => setWeights({ ...weights, energy: parseFloat(e.target.value) })}
                className="w-full accent-[var(--accent)] cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Algorithm Selection Selector Bar */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-xs font-mono text-[var(--text-muted)] mr-1">Select for side-by-side:</span>
        {recalculatedAlgorithms.map((alg) => {
          const isSelected = selectedAlgs.includes(alg.algorithm);
          return (
            <button
              key={alg.algorithm}
              onClick={() => toggleAlgorithm(alg.algorithm)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors border cursor-pointer ${
                isSelected
                  ? 'bg-[var(--surface-elevated)] border-[var(--accent)] text-[var(--accent)] font-semibold shadow-xs'
                  : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              #{alg.dynamicRank} {alg.algorithm}
            </button>
          );
        })}
        <button
          onClick={() => setSelectedAlgs(recalculatedAlgorithms.map((a) => a.algorithm))}
          className="text-[11px] text-[var(--accent)] hover:underline ml-2 font-mono cursor-pointer"
        >
          Select All
        </button>
      </div>

      {/* Side-by-Side Comparison Matrix */}
      {activeCompareList.length > 0 ? (
        <div className="overflow-x-auto pt-2">
          <table className="ws-table font-mono text-xs">
            <thead>
              <tr>
                <th className="w-12">Rank</th>
                <th>Algorithm</th>
                <th className="text-right">Score</th>
                <th className="text-right">Accuracy ↑</th>
                <th className="text-right">Latency ↓</th>
                <th className="text-right">Model Size ↓</th>
                <th className="text-right">Energy / Power ↓</th>
                <th className="text-right">FLOPs</th>
                <th className="text-right">TOPs (Throughput)</th>
                <th className="text-center">Pareto Front</th>
                <th className="text-center">Rationale</th>
              </tr>
            </thead>
            <tbody>
              {activeCompareList.map((alg) => {
                const isBest = alg.dynamicRank === 1;
                const isExpanded = expandedExplanation === alg.algorithm;

                return (
                  <React.Fragment key={alg.algorithm}>
                    <tr className={isBest ? 'bg-blue-500/5 font-medium' : ''}>
                      <td className="font-semibold">
                        <span className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                          isBest
                            ? 'bg-[var(--accent)] text-white font-bold'
                            : 'bg-[var(--surface-secondary)] text-[var(--text-muted)]'
                        }`}>
                          #{alg.dynamicRank}
                        </span>
                      </td>
                      <td className="font-bold text-[var(--text-primary)] font-sans">
                        {alg.algorithm}
                        {isBest && (
                          <span className="ml-2 text-[10px] text-[var(--success)] font-mono font-bold bg-[var(--success)]/10 px-1 py-0.2 rounded border border-[var(--success)]/30">
                            [LEADER]
                          </span>
                        )}
                      </td>
                      <td className="text-right font-bold text-[var(--accent)]">
                        {alg.dynamicScore.toFixed(1)} / 100
                      </td>
                      <td className="text-right text-[var(--success)] font-semibold">
                        {alg.accuracy.toFixed(2)}%
                      </td>
                      <td className="text-right text-[var(--text-primary)]">
                        {alg.latency_ms.toFixed(2)} ms
                      </td>
                      <td className="text-right text-[var(--text-secondary)]">
                        {alg.model_size_mb.toFixed(2)} MB
                      </td>
                      <td className="text-right">
                        <div className="text-[var(--text-primary)]">{alg.energy_j.toFixed(4)} J</div>
                        <div className="text-[10px] text-[var(--text-muted)] font-sans">
                          {(alg.power_w || 0).toFixed(2)} W ({((alg.power_w || 0) * 1000).toFixed(0)} mW)
                        </div>
                      </td>
                      <td className="text-right text-[var(--text-primary)]">
                        {alg.flops_m ? `${alg.flops_m.toFixed(1)} M` : '--'}
                      </td>
                      <td className="text-right text-[var(--accent)] font-semibold">
                        {alg.tops ? `${alg.tops.toFixed(3)} TOPs` : '--'}
                      </td>
                      <td className="text-center">
                        {alg.isPareto ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--success)] border border-[var(--success)]/40 bg-[var(--success)]/15 px-2 py-0.5 rounded-full shadow-xs">
                            <span>★</span>
                            <span>Non-Dominated</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-[var(--text-muted)] px-1.5 py-0.5 rounded bg-[var(--surface-secondary)] border border-[var(--border)]">
                            Dominated
                          </span>
                        )}
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => setExpandedExplanation(isExpanded ? null : alg.algorithm)}
                          className="text-[11px] text-[var(--accent)] hover:underline inline-flex items-center gap-0.5 cursor-pointer font-sans"
                        >
                          <span>Why #{alg.dynamicRank}?</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Trade-Off Rationale */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={11} className="p-3.5 bg-[var(--surface-secondary)] border-b border-[var(--border)] animate-fade-in">
                          <div className="space-y-2 font-sans text-xs text-[var(--text-secondary)]">
                            <div className="font-semibold text-[var(--text-primary)] font-mono flex items-center gap-2">
                              <span>Trade-Off Rationale for {alg.algorithm} (Rank #{alg.dynamicRank}):</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--accent)]">
                                {alg.isPareto ? 'Pareto Optimal Frontier Solution' : 'Sub-Optimal Trade-Off'}
                              </span>
                            </div>
                            <p className="leading-relaxed">
                              {alg.algorithm} delivers an overall weighted score of <strong>{alg.dynamicScore.toFixed(1)}/100</strong> under active weights (Accuracy: {(weights.accuracy*100).toFixed(0)}%, Latency: {(weights.latency*100).toFixed(0)}%, Size: {(weights.size*100).toFixed(0)}%, Energy: {(weights.energy*100).toFixed(0)}%).
                              It consumes <strong>{alg.energy_j.toFixed(4)} J</strong> per inference (avg power <strong>{(alg.power_w || 0).toFixed(2)} W</strong>), processing at <strong>{alg.flops_m?.toFixed(1)} MFLOPs</strong> with compute density of <strong>{alg.tops?.toFixed(3)} TOPs</strong>.
                              {alg.latency_ms < 6.2 ? ' Exhibits rapid hardware inference velocity.' : ' Shows increased latency execution overhead.'}
                              {alg.accuracy > 95.5 ? ' Preserves exceptionally high Top-1 vision accuracy.' : ' Displays slight classification degradation.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6 text-center text-xs text-[var(--text-muted)]">
          Select at least one algorithm above to view comparative telemetry.
        </div>
      )}
    </div>
  );
};
