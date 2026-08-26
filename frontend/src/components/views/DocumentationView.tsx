import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, CheckCircle2, Layers } from 'lucide-react';
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
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
        <div>
          <h2 className="ws-page-title">Metaheuristic Optimizers &amp; Specifications</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Mathematical formulations, algorithmic contracts, and empirical benchmark behaviors.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 ws-button-primary text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Register Custom Algorithm</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: List of 10 Algorithms */}
        <div className="space-y-1.5">
          {algorithms.map((alg) => {
            const isSelected = selectedAlg?.key === alg.key;
            return (
              <div
                key={alg.key}
                onClick={() => setSelectedAlg(alg)}
                className={`p-3 rounded-md border cursor-pointer transition-colors select-none flex items-center justify-between ${
                  isSelected
                    ? 'bg-[var(--surface-elevated)] border-[var(--accent)]'
                    : 'ws-panel text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <div>
                  <div className="font-semibold text-xs font-mono text-[var(--text-primary)]">
                    {alg.key} &bull; {alg.name}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    {alg.category} &bull; {alg.year}
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono font-medium px-1.5 py-0.2 rounded ${
                    alg.is_custom
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                      : 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/30'
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
          <div className="ws-panel p-6 lg:col-span-2 space-y-5 text-xs">
            {/* Title & Classification */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <span className="text-[10px] font-mono text-[var(--accent)] font-semibold uppercase">
                  {selectedAlg.category}
                </span>
                <h3 className="text-base font-bold text-[var(--text-primary)] mt-0.5">
                  {selectedAlg.name} ({selectedAlg.key})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded font-medium ${
                    selectedAlg.is_custom
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                      : 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/30'
                  }`}
                >
                  {selectedAlg.is_custom ? 'CUSTOM USER OPTIMIZER' : 'MATHEMATICALLY VERIFIED'}
                </span>

                {selectedAlg.is_custom && (
                  <button
                    onClick={() => handleDelete(selectedAlg.key, selectedAlg.name)}
                    className="p-1 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded transition-colors"
                    title="Delete Custom Algorithm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Theoretical Characteristics */}
            <div className="space-y-3">
              <h4 className="ws-section-title text-xs">Theoretical Characteristics</h4>

              <div>
                <span className="text-[11px] font-mono text-[var(--text-muted)] block mb-1">Primary Literature Reference:</span>
                <div className="p-2.5 rounded bg-[var(--surface-secondary)] border border-[var(--border)] font-mono text-[11px] text-[var(--text-secondary)]">
                  {selectedAlg.authors} ({selectedAlg.year}). <em>{selectedAlg.name}</em>.
                </div>
              </div>

              <div>
                <span className="text-[11px] font-mono text-[var(--text-muted)] block mb-1">Search Mechanism:</span>
                <p className="text-[var(--text-secondary)] leading-relaxed">{selectedAlg.description}</p>
              </div>

              <div>
                <span className="text-[11px] font-mono text-[var(--text-muted)] block mb-1">Key Algorithmic Strengths:</span>
                <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
                  {selectedAlg.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Standard Implementation Contract */}
            <div className="p-3.5 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-md space-y-1.5 font-mono text-[11px]">
              <span className="font-semibold text-[var(--text-primary)]">Standard Optimization Contract:</span>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Inherits from <code>BaseOptimizer</code> with continuous search space $[0.0, 1.0]^D$, multi-objective fitness evaluation, population size $N$, maximum iterations $T$, and deterministic seed initialization.
              </p>
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
