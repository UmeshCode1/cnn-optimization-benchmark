import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, FileText, Sparkles } from 'lucide-react';
import { AlgorithmMeta } from '../../types';
import { api } from '../../services/api';

export const DocumentationView: React.FC = () => {
  const [algorithms, setAlgorithms] = useState<AlgorithmMeta[]>([]);
  const [selectedAlg, setSelectedAlg] = useState<AlgorithmMeta | null>(null);

  useEffect(() => {
    api.getAlgorithms().then((algs) => {
      setAlgorithms(algs);
      if (algs.length > 0) setSelectedAlg(algs[0]);
    });
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            10 METAHEURISTIC OPTIMIZERS &bull; MATHEMATICAL CONTRACTS
          </h2>
          <p className="text-xs text-slate-400">
            Literature citations, update equations, and search behaviors for all 10 algorithms.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: List of 10 Algorithms */}
        <div className="space-y-2">
          {algorithms.map((alg) => {
            const isSelected = selectedAlg?.key === alg.key;
            return (
              <div
                key={alg.key}
                onClick={() => setSelectedAlg(alg)}
                className={`p-3 rounded-lg border cursor-pointer transition select-none flex items-center justify-between ${
                  isSelected
                    ? 'bg-blue-950/40 border-blue-500 text-slate-100 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-sm font-mono text-slate-100">{alg.key} &bull; {alg.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{alg.category} &bull; {alg.year}</div>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {alg.status}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Algorithm Deep-Dive Details */}
        {selectedAlg && (
          <div className="lab-card p-5 lg:col-span-2 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-sans">
              <div>
                <span className="text-xs font-mono text-blue-400 font-bold uppercase">{selectedAlg.category}</span>
                <h3 className="text-lg font-bold text-slate-100 mt-0.5">{selectedAlg.name} ({selectedAlg.key})</h3>
              </div>
              <span className="text-xs font-mono px-2 py-1 bg-emerald-950 text-emerald-300 border border-emerald-700 rounded font-bold">
                MATHEMATICALLY VERIFIED
              </span>
            </div>

            <div className="space-y-3 text-slate-300 font-sans leading-relaxed text-xs">
              <div>
                <h4 className="text-xs font-bold text-slate-200 font-mono uppercase mb-1">Primary Reference &amp; Citation:</h4>
                <p className="text-slate-400 bg-slate-900 p-2.5 rounded border border-slate-800 font-mono text-[11px]">
                  {selectedAlg.authors} ({selectedAlg.year}). <em>{selectedAlg.name}</em>.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-200 font-mono uppercase mb-1">Search Mechanism &amp; Exploration/Exploitation:</h4>
                <p className="text-slate-300">{selectedAlg.description}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-200 font-mono uppercase mb-1">Key Algorithmic Strengths:</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {selectedAlg.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-blue-950/20 border border-blue-800/40 rounded text-[11px] text-slate-300 space-y-1">
                <span className="font-bold text-blue-300 font-mono">Standard Optimization Contract:</span>
                <p>
                  Implements <code>BaseOptimizer.step(t)</code> with identical population size, boundary bounds <code>[0.0, 1.0]</code>, objective cost evaluation, and deterministic seed initialization.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
