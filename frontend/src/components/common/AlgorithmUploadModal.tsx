import React, { useState, useRef } from 'react';
import { Sparkles, X, Upload, Code2, AlertCircle, CheckCircle2, FileCode } from 'lucide-react';
import { api } from '../../services/api';
import { AlgorithmMeta } from '../../types';

interface AlgorithmUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAlgorithmAdded: (algo: AlgorithmMeta) => void;
}

export const AlgorithmUploadModal: React.FC<AlgorithmUploadModalProps> = ({
  isOpen,
  onClose,
  onAlgorithmAdded,
}) => {
  const [tab, setTab] = useState<'form' | 'file'>('form');
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Swarm Intelligence');
  const [description, setDescription] = useState('');
  const [authors, setAuthors] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [explorationRate, setExplorationRate] = useState(0.5);
  const [pythonCode, setPythonCode] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.endsWith('.py')) {
        setError('Please select a Python (.py) source file');
        return;
      }
      setFile(selected);
      setError(null);
      if (!key) {
        const stem = selected.name.replace(/\.py$/i, '').toUpperCase().slice(0, 6);
        setKey(stem);
      }
      if (!name) {
        const stem = selected.name.replace(/\.py$/i, '').replace(/[_-]/g, ' ');
        setName(stem.charAt(0).toUpperCase() + stem.slice(1));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normKey = key.trim().toUpperCase();
    if (!normKey) {
      setError('Algorithm Acronym / Key is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (tab === 'file' && file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('key', normKey);
        formData.append('name', name.trim() || normKey);
        formData.append('category', category);
        if (description.trim()) formData.append('description', description.trim());
        formData.append('exploration_rate', String(explorationRate));

        const result = await api.uploadAlgorithmFile(formData);
        onAlgorithmAdded(result);
      } else {
        const result = await api.registerAlgorithm({
          key: normKey,
          name: name.trim() || normKey,
          category,
          description: description.trim() || 'Custom metaheuristic optimizer',
          authors: authors.trim() || 'Custom Author',
          year: Number(year) || 2026,
          exploration_rate: explorationRate,
          python_code: pythonCode.trim() || undefined,
        });
        onAlgorithmAdded(result);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to register custom algorithm');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Add Custom Optimization Algorithm</h3>
              <p className="text-xs text-slate-400">Integrate a custom metaheuristic for CNN compression</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-lg bg-slate-800 p-1 text-xs font-mono">
          <button
            type="button"
            onClick={() => setTab('form')}
            className={`flex-1 py-1.5 rounded-md font-semibold transition ${
              tab === 'form' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Define Parameters / Code
          </button>
          <button
            type="button"
            onClick={() => setTab('file')}
            className={`flex-1 py-1.5 rounded-md font-semibold transition ${
              tab === 'file' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Upload Python Module (.py)
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'file' && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700 hover:border-slate-500 bg-slate-800/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".py"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div className="space-y-1 text-center">
                  <FileCode className="w-8 h-8 mx-auto text-emerald-400" />
                  <div className="text-sm font-bold text-slate-200">{file.name}</div>
                  <div className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB Python Module</div>
                </div>
              ) : (
                <div className="space-y-1 text-center">
                  <Upload className="w-8 h-8 mx-auto text-slate-400" />
                  <div className="text-sm font-semibold text-slate-200">Click to select custom .py algorithm file</div>
                  <div className="text-xs text-slate-400">Must inherit from BaseOptimizer or define metaheuristic steps</div>
                </div>
              )}
            </div>
          )}

          {/* Key and Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                Algorithm Key / Acronym <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                placeholder="e.g., PSO, CSA, ABC"
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono font-bold focus:outline-none focus:border-blue-500 uppercase"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                Full Algorithm Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Particle Swarm Optimization"
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Category & Exploration Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="Swarm Intelligence">Swarm Intelligence</option>
                <option value="Evolutionary Computation">Evolutionary Computation</option>
                <option value="Physics-Based">Physics-Based</option>
                <option value="Mathematical & Bio-Inspired">Mathematical & Bio-Inspired</option>
                <option value="Hybrid Heuristic">Hybrid Heuristic</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Exploration Ratio:</span>
                <span className="font-mono text-cyan-400">{(explorationRate * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={explorationRate}
                onChange={(e) => setExplorationRate(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer mt-2"
              />
            </div>
          </div>

          {/* Authors & Year */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Author / Attribution</label>
              <input
                type="text"
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
                placeholder="e.g., Kennedy & Eberhart"
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || 2026)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Search dynamics, biological inspiration, and mathematical operator mechanics..."
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {tab === 'form' && (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                Optional Custom Python Code (Overrides standard dynamic wrapper)
              </label>
              <textarea
                rows={4}
                value={pythonCode}
                onChange={(e) => setPythonCode(e.target.value)}
                placeholder={`class CustomOptimizer(BaseOptimizer):\n    def optimize(self, fitness_func, dim, bounds):\n        # Custom position updates\n        pass`}
                className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-[11px] focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !key.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition"
            >
              {isSubmitting ? (
                <span>Registering...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Register & Activate Algorithm</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
