import React, { useState } from 'react';
import {
  Sparkles,
  Trophy,
  ArrowUpDown,
  Download,
  CheckCircle2,
  Sliders,
  Filter,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  GitFork,
  ArrowRight,
} from 'lucide-react';
import { Experiment, RankedAlgorithm, ParetoPoint, AlgorithmStats } from '../../types';
import { MetricCard } from '../common/MetricCard';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { BarChart } from '../charts/BarChart';
import { ScatterParetoChart } from '../charts/ScatterParetoChart';
import { api } from '../../services/api';

interface ComparisonDashboardViewProps {
  experiment: Experiment;
  rankedAlgorithms: RankedAlgorithm[];
  statistics: Record<string, AlgorithmStats>;
  paretoPoints: ParetoPoint[];
  onRecalculateWeights: (weights: any, statMode: string) => void;
  onCompareSelected: (selectedAlgs: string[]) => void;
  onViewPareto: () => void;
  onViewConvergence: () => void;
  onViewStatistics: () => void;
}

export const ComparisonDashboardView: React.FC<ComparisonDashboardViewProps> = ({
  experiment,
  rankedAlgorithms,
  statistics,
  paretoPoints,
  onRecalculateWeights,
  onCompareSelected,
  onViewPareto,
  onViewConvergence,
  onViewStatistics,
}) => {
  // Sort State
  const [sortKey, setSortKey] = useState<string>('overall_score');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [statMode, setStatMode] = useState<string>('MEAN');

  // Weights interactive state
  const [weights, setWeights] = useState({
    weight_accuracy: experiment.weight_accuracy || 0.40,
    weight_latency: experiment.weight_latency || 0.25,
    weight_model_size: experiment.weight_model_size || 0.20,
    weight_energy: experiment.weight_energy || 0.15,
  });

  const [isWeightPanelOpen, setIsWeightPanelOpen] = useState<boolean>(false);

  // Sorting
  const sortedAlgorithms = [...rankedAlgorithms].sort((a: any, b: any) => {
    let valA = a[sortKey] ?? 0;
    let valB = b[sortKey] ?? 0;
    if (typeof valA === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortAsc ? valA - valB : valB - valA;
  });

  const filteredAlgorithms = sortedAlgorithms.filter((a) =>
    a.algorithm.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      // Default to ascending for latency/size/energy (lower is better)
      const lowerBetter = ['latency_ms', 'model_size_mb', 'energy_j', 'accuracy_drop', 'parameters_m', 'flops_m'];
      setSortAsc(lowerBetter.includes(key));
    }
  };

  const toggleSelectAlg = (alg: string) => {
    if (selectedForCompare.includes(alg)) {
      setSelectedForCompare(selectedForCompare.filter((a) => a !== alg));
    } else {
      setSelectedForCompare([...selectedForCompare, alg]);
    }
  };

  const handleSelectAllTable = () => {
    if (selectedForCompare.length === rankedAlgorithms.length) {
      setSelectedForCompare([]);
    } else {
      setSelectedForCompare(rankedAlgorithms.map((a) => a.algorithm));
    }
  };

  const handleApplyWeights = () => {
    onRecalculateWeights(weights, statMode);
  };

  // Find individual champions
  const bestAcc = rankedAlgorithms.length > 0
    ? [...rankedAlgorithms].sort((a, b) => b.accuracy - a.accuracy)[0]
    : null;
  const bestLat = rankedAlgorithms.length > 0
    ? [...rankedAlgorithms].sort((a, b) => a.latency_ms - b.latency_ms)[0]
    : null;
  const bestSize = rankedAlgorithms.length > 0
    ? [...rankedAlgorithms].sort((a, b) => a.model_size_mb - b.model_size_mb)[0]
    : null;
  const bestEnergy = rankedAlgorithms.length > 0
    ? [...rankedAlgorithms].sort((a, b) => a.energy_j - b.energy_j)[0]
    : null;

  const bestOverall = rankedAlgorithms.length > 0 ? rankedAlgorithms[0] : null;

  // Best values for table column highlighting
  const maxAcc = Math.max(...rankedAlgorithms.map((r) => r.accuracy), 0);
  const minLat = Math.min(...rankedAlgorithms.map((r) => r.latency_ms), Infinity);
  const minSize = Math.min(...rankedAlgorithms.map((r) => r.model_size_mb), Infinity);
  const minEnergy = Math.min(...rankedAlgorithms.map((r) => r.energy_j), Infinity);
  const maxScore = Math.max(...rankedAlgorithms.map((r) => r.overall_score), 0);

  const paretoSet = new Set(experiment.pareto_optimal_algorithms || []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Export Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100 tracking-wide">
              BENCHMARK RESULTS &bull; {experiment.title}
            </h2>
            <ProvenanceBadge type={experiment.is_demo ? 'DEMO DATA' : 'MEASURED'} />
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            ID: <span className="text-blue-400">{experiment.id}</span> &bull; {experiment.dataset_name} &bull; {experiment.cnn_model_name} &bull; {experiment.quantization_type} &bull; {experiment.number_of_runs} Runs
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Compare Selected CTA */}
          {selectedForCompare.length > 0 && (
            <button
              onClick={() => onCompareSelected(selectedForCompare)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded shadow transition"
            >
              <span>Compare Selected ({selectedForCompare.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Export CSV */}
          <a
            href={api.getExportUrl(experiment.id, 'csv')}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono rounded transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV</span>
          </a>

          {/* Export Markdown Report */}
          <a
            href={api.getExportUrl(experiment.id, 'markdown')}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono rounded transition"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Markdown Report</span>
          </a>
        </div>
      </div>

      {/* Mode 1 & Mode 2 & Mode 3 Top Champion Banners */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Winner Highlight Card */}
        <div className="lab-card p-4 lg:col-span-2 bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 border-blue-500/60 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                BEST OVERALL OPTIMIZER &bull; MODE 2
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900 text-blue-300 border border-blue-700 font-bold">
                RANK #1
              </span>
            </div>

            <div className="flex items-baseline gap-3 my-1">
              <h3 className="text-2xl font-bold font-mono text-slate-100">{bestOverall?.algorithm || '--'}</h3>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                Overall Score: {bestOverall?.overall_score.toFixed(1)}/100
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {experiment.best_algorithm_reason || 'Evaluated under standardized baseline conditions.'}
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Accuracy: <strong className="text-emerald-400">{bestOverall?.accuracy.toFixed(2)}%</strong></span>
            <span className="text-slate-400">Latency: <strong className="text-slate-200">{bestOverall?.latency_ms.toFixed(2)} ms</strong></span>
            <span className="text-slate-400">Size: <strong className="text-slate-200">{bestOverall?.model_size_mb.toFixed(2)} MB</strong></span>
            <span className="text-slate-400">Energy: <strong className="text-slate-200">{bestOverall?.energy_j.toFixed(4)} J</strong></span>
          </div>
        </div>

        {/* Individual Best Metric Champions */}
        <div className="lab-card p-4 lg:col-span-2 space-y-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              INDIVIDUAL METRIC CHAMPIONS &bull; MODE 1
            </span>
            <span className="text-[10px] font-mono text-slate-400">Single-Objective</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <div className="text-slate-400 text-[10px]">HIGHEST ACCURACY</div>
              <div className="text-emerald-400 font-bold text-sm">{bestAcc?.algorithm} &bull; {bestAcc?.accuracy.toFixed(2)}%</div>
            </div>
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <div className="text-slate-400 text-[10px]">LOWEST LATENCY</div>
              <div className="text-cyan-400 font-bold text-sm">{bestLat?.algorithm} &bull; {bestLat?.latency_ms.toFixed(2)} ms</div>
            </div>
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <div className="text-slate-400 text-[10px]">SMALLEST MODEL</div>
              <div className="text-purple-400 font-bold text-sm">{bestSize?.algorithm} &bull; {bestSize?.model_size_mb.toFixed(2)} MB</div>
            </div>
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <div className="text-slate-400 text-[10px]">LOWEST ENERGY</div>
              <div className="text-amber-400 font-bold text-sm">{bestEnergy?.algorithm} &bull; {bestEnergy?.energy_j.toFixed(4)} J</div>
            </div>
          </div>

          {/* Pareto summary */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono text-[11px]">
              Pareto Optimal: <strong className="text-emerald-400">{experiment.pareto_optimal_algorithms?.join(', ') || 'None'}</strong>
            </span>
            <button
              onClick={onViewPareto}
              className="text-blue-400 hover:underline text-[11px] font-mono flex items-center gap-1"
            >
              Open Pareto Explorer &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Objective Weights & Stats Mode Control */}
      <div className="lab-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Objective Scoring Weights &amp; Statistical Aggregation
            </h4>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs font-mono">
              <span className="text-slate-400">Stat Aggregation:</span>
              <select
                value={statMode}
                onChange={(e) => {
                  setStatMode(e.target.value);
                  onRecalculateWeights(weights, e.target.value);
                }}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
              >
                <option value="MEAN">Mean Across Runs</option>
                <option value="MEDIAN">Median Across Runs</option>
                <option value="BEST">Best Single Run</option>
              </select>
            </div>

            <button
              onClick={() => setIsWeightPanelOpen(!isWeightPanelOpen)}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono transition"
            >
              {isWeightPanelOpen ? 'Hide Sliders' : 'Adjust Weights (100%)'}
            </button>
          </div>
        </div>

        {isWeightPanelOpen && (
          <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Accuracy Weight:</span>
                <span className="font-bold text-blue-400">{(weights.weight_accuracy * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.05"
                value={weights.weight_accuracy}
                onChange={(e) => setWeights({ ...weights, weight_accuracy: parseFloat(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Latency Weight:</span>
                <span className="font-bold text-cyan-400">{(weights.weight_latency * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.05"
                value={weights.weight_latency}
                onChange={(e) => setWeights({ ...weights, weight_latency: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Model Size Weight:</span>
                <span className="font-bold text-purple-400">{(weights.weight_model_size * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.05"
                value={weights.weight_model_size}
                onChange={(e) => setWeights({ ...weights, weight_model_size: parseFloat(e.target.value) })}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Energy Weight:</span>
                <span className="font-bold text-amber-400">{(weights.weight_energy * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.05"
                value={weights.weight_energy}
                onChange={(e) => setWeights({ ...weights, weight_energy: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="sm:col-span-4 flex justify-end pt-2">
              <button
                onClick={handleApplyWeights}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded transition"
              >
                Apply &amp; Recalculate Ranking
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Results Table */}
      <div className="lab-card p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Comprehensive Algorithm Comparison Table
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              ({filteredAlgorithms.length} Algorithms Evaluated)
            </span>
          </div>

          {/* Filter / Search input */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search algorithm..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500 w-44"
              />
            </div>
            <button
              onClick={handleSelectAllTable}
              className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 hover:text-white"
            >
              {selectedForCompare.length === rankedAlgorithms.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>

        {/* Table Container with Horizontal Scroll */}
        <div className="overflow-x-auto">
          <table className="lab-table font-mono text-xs">
            <thead>
              <tr>
                <th className="w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectedForCompare.length === rankedAlgorithms.length && rankedAlgorithms.length > 0}
                    onChange={handleSelectAllTable}
                    className="rounded bg-slate-900 text-blue-600"
                  />
                </th>
                <th onClick={() => handleSort('rank')} className="cursor-pointer hover:text-white">
                  Rank {sortKey === 'rank' && (sortAsc ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('algorithm')} className="cursor-pointer hover:text-white">
                  Algorithm {sortKey === 'algorithm' && (sortAsc ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('accuracy')} className="cursor-pointer hover:text-white text-right">
                  Accuracy (%) ↑ {sortKey === 'accuracy' && (sortAsc ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('latency_ms')} className="cursor-pointer hover:text-white text-right">
                  Latency (ms) ↓ {sortKey === 'latency_ms' && (sortAsc ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('model_size_mb')} className="cursor-pointer hover:text-white text-right">
                  Size (MB) ↓ {sortKey === 'model_size_mb' && (sortAsc ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('energy_j')} className="cursor-pointer hover:text-white text-right">
                  Energy (J) ↓ {sortKey === 'energy_j' && (sortAsc ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('overall_score')} className="cursor-pointer hover:text-white text-right">
                  Score (/100) ↑ {sortKey === 'overall_score' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="text-center">Pareto Front</th>
              </tr>
            </thead>
            <tbody>
              {/* Baseline Row */}
              <tr className="bg-slate-900/60 font-semibold border-b border-slate-700">
                <td className="text-center">&bull;</td>
                <td className="text-slate-400">Base</td>
                <td className="text-slate-300 font-bold">Baseline {experiment.cnn_model_name}</td>
                <td className="text-right text-slate-300">{experiment.baseline.accuracy.toFixed(2)}%</td>
                <td className="text-right text-slate-300">{experiment.baseline.latency_ms.toFixed(2)} ms</td>
                <td className="text-right text-slate-300">{experiment.baseline.model_size_mb.toFixed(2)} MB</td>
                <td className="text-right text-slate-300">{experiment.baseline.energy_j.toFixed(4)} J</td>
                <td className="text-right text-slate-400">100.0</td>
                <td className="text-center text-slate-500">Baseline</td>
              </tr>

              {/* Algorithm Rows */}
              {filteredAlgorithms.map((r) => {
                const isSelected = selectedForCompare.includes(r.algorithm);
                const isPareto = paretoSet.has(r.algorithm);

                const isBestAcc = Math.abs(r.accuracy - maxAcc) < 0.001;
                const isBestLat = Math.abs(r.latency_ms - minLat) < 0.001;
                const isBestSize = Math.abs(r.model_size_mb - minSize) < 0.001;
                const isBestEnergy = Math.abs(r.energy_j - minEnergy) < 0.001;
                const isBestScore = Math.abs(r.overall_score - maxScore) < 0.001;

                return (
                  <tr
                    key={r.algorithm}
                    className={`transition-colors ${isSelected ? 'bg-blue-950/30' : ''}`}
                  >
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectAlg(r.algorithm)}
                        className="rounded bg-slate-900 text-blue-600"
                      />
                    </td>
                    <td className="font-bold text-slate-400">#{r.rank}</td>
                    <td>
                      <span className="font-bold text-slate-100">{r.algorithm}</span>
                    </td>
                    <td className={`text-right ${isBestAcc ? 'text-emerald-400 font-bold bg-emerald-950/20' : 'text-slate-300'}`}>
                      {r.accuracy.toFixed(2)}%
                    </td>
                    <td className={`text-right ${isBestLat ? 'text-cyan-400 font-bold bg-cyan-950/20' : 'text-slate-300'}`}>
                      {r.latency_ms.toFixed(2)} ms
                    </td>
                    <td className={`text-right ${isBestSize ? 'text-purple-400 font-bold bg-purple-950/20' : 'text-slate-300'}`}>
                      {r.model_size_mb.toFixed(2)} MB
                    </td>
                    <td className={`text-right ${isBestEnergy ? 'text-amber-400 font-bold bg-amber-950/20' : 'text-slate-300'}`}>
                      {r.energy_j.toFixed(4)} J
                    </td>
                    <td className={`text-right font-bold ${isBestScore ? 'text-blue-400' : 'text-slate-200'}`}>
                      {r.overall_score.toFixed(1)}
                    </td>
                    <td className="text-center">
                      {isPareto ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          PARETO
                        </span>
                      ) : (
                        <span className="text-slate-600">&ndash;</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4 Primary Comparison Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          title="1. Top-1 Accuracy by Algorithm"
          unit="%"
          isHigherBetter={true}
          data={[
            { label: 'Base', value: experiment.baseline.accuracy, isBaseline: true },
            ...rankedAlgorithms.map((r) => ({
              label: r.algorithm,
              value: r.accuracy,
              isBest: Math.abs(r.accuracy - maxAcc) < 0.001,
            })),
          ]}
        />

        <BarChart
          title="2. Inference Latency by Algorithm"
          unit="ms"
          isHigherBetter={false}
          data={[
            { label: 'Base', value: experiment.baseline.latency_ms, isBaseline: true },
            ...rankedAlgorithms.map((r) => ({
              label: r.algorithm,
              value: r.latency_ms,
              isBest: Math.abs(r.latency_ms - minLat) < 0.001,
            })),
          ]}
        />

        <BarChart
          title="3. Serialized Model Size by Algorithm"
          unit="MB"
          isHigherBetter={false}
          data={[
            { label: 'Base', value: experiment.baseline.model_size_mb, isBaseline: true },
            ...rankedAlgorithms.map((r) => ({
              label: r.algorithm,
              value: r.model_size_mb,
              isBest: Math.abs(r.model_size_mb - minSize) < 0.001,
            })),
          ]}
        />

        <BarChart
          title="4. Energy Consumption per Batch"
          unit="J"
          isHigherBetter={false}
          data={[
            { label: 'Base', value: experiment.baseline.energy_j, isBaseline: true },
            ...rankedAlgorithms.map((r) => ({
              label: r.algorithm,
              value: r.energy_j,
              isBest: Math.abs(r.energy_j - minEnergy) < 0.001,
            })),
          ]}
        />
      </div>
    </div>
  );
};
