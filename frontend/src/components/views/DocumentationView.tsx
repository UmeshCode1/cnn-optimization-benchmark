import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, Plus, Sparkles, Trash2, Code2, Layers } from 'lucide-react';
import { AlgorithmMeta } from '../../types';
import { api } from '../../services/api';
import { AlgorithmUploadModal } from '../common/AlgorithmUploadModal';

export const DocumentationView: React.FC = () => {
  const [algorithms, setAlgorithms] = useState<AlgorithmMeta[]>([]);
  const [selectedAlg, setSelectedAlg] = useState<AlgorithmMeta | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAlgorithms = async () => {
    try {
      const algs = await api.getAlgorithms();
      setAlgorithms(algs);
      if (algs.length > 0 && !selectedAlg) {
        setSelectedAlg(algs[0]);
      }
    } catch (err) {
      console.error('Failed to load algorithms:', err);
    }
  };

  useEffect(() => {
    fetchAlgorithms();
  }, []);

  const handleDelete = async (key: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete custom algorithm "${name}" (${key})?`)) {
      return;
    }
    try {
      await api.deleteAlgorithm(key);
      setAlgorithms((prev) => prev.filter((a) => a.key !== key));
      if (selectedAlg?.key === key) {
        setSelectedAlg(algorithms[0] || null);
      }
    } catch (err: any) {
      alert(`Failed to delete algorithm: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            METAHEURISTIC OPTIMIZATION ALGORITHMS &bull; MATHEMATICAL CONTRACTS
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Standardized metaheuristic specifications, mathematical formulations, and custom registered optimizers.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-emerald-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Algorithm</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: List of Algorithms */}
        <div className="space-y-2">
          {algorithms.map((alg) => {
            const isSelected = selectedAlg?.key === alg.key;
            return (
              <div
                key={alg.key}
                onClick={() => setSelectedAlg(alg)}
                className={`p-3 rounded-lg border cursor-pointer transition select-none flex items-center justify-between ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500 text-[var(--text-primary)] shadow-sm'
                    : 'lab-card text-[var(--text-secondary)] hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="font-bold text-sm font-mono text-[var(--text-primary)]">
                    {alg.key} &bull; {alg.name}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    {alg.category} &bull; {alg.year}
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    alg.is_custom
                      ? 'bg-purple-900/50 text-purple-300 border border-purple-600/40'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {alg.is_custom ? 'CUSTOM' : 'VERIFIED'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Algorithm Deep-Dive Details */}
        {selectedAlg && (
          <div className="lab-card p-5 lg:col-span-2 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 font-sans">
              <div>
                <span className="text-xs font-mono text-blue-400 font-bold uppercase">
                  {selectedAlg.category}
                </span>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mt-0.5">
                  {selectedAlg.name} ({selectedAlg.key})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-mono px-2.5 py-1 rounded font-bold ${
                    selectedAlg.is_custom
                      ? 'bg-purple-900/50 text-purple-300 border border-purple-700'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  }`}
                >
                  {selectedAlg.is_custom ? 'USER CUSTOM OPTIMIZER' : 'MATHEMATICALLY VERIFIED'}
                </span>

                {selectedAlg.is_custom && (
                  <button
                    onClick={() => handleDelete(selectedAlg.key, selectedAlg.name)}
                    className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                    title="Delete Custom Algorithm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3 text-[var(--text-secondary)] font-sans leading-relaxed text-xs">
              <div>
                <h4 className="text-xs font-bold text-[var(--text-primary)] font-mono uppercase mb-1">
                  Primary Reference &amp; Citation:
                </h4>
                <p className="text-[var(--text-muted)] bg-[var(--bg-surface)] p-2.5 rounded-lg border border-[var(--border-color)] font-mono text-[11px]">
                  {selectedAlg.authors} ({selectedAlg.year}). <em>{selectedAlg.name}</em>.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[var(--text-primary)] font-mono uppercase mb-1">
                  Search Mechanism &amp; Exploration/Exploitation:
                </h4>
                <p className="text-[var(--text-secondary)]">{selectedAlg.description}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[var(--text-primary)] font-mono uppercase mb-1">
                  Key Algorithmic Strengths:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
                  {selectedAlg.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[11px] text-[var(--text-secondary)] space-y-1">
                <span className="font-bold text-blue-400 font-mono">Standard Optimization Contract:</span>
                <p>
                  Adheres to <code>BaseOptimizer.optimize()</code> with normalized boundary bounds <code>[0.0, 1.0]</code>, objective cost evaluation, and deterministic seed initialization.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Algorithm Upload Modal */}
      <AlgorithmUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAlgorithmAdded={(newAlgo) => {
          setAlgorithms((prev) => [...prev, newAlgo]);
          setSelectedAlg(newAlgo);
        }}
      />
    </div>
  );
};
