import React from 'react';
import { X, Database, Layers, CheckCircle2, Sparkles, Image, Shield, Info, ArrowRight } from 'lucide-react';
import { DatasetInfo } from '../../types';

interface DatasetPreviewModalProps {
  isOpen: boolean;
  dataset: DatasetInfo | null;
  onClose: () => void;
  onSelectForBenchmark?: (dataset: DatasetInfo) => void;
}

export const DatasetPreviewModal: React.FC<DatasetPreviewModalProps> = ({
  isOpen,
  dataset,
  onClose,
  onSelectForBenchmark,
}) => {
  if (!isOpen || !dataset) return null;

  const getDatasetColor = (name: string) => {
    if (name.includes('CIFAR-100')) return 'from-amber-500/20 to-orange-500/10 border-orange-500/30';
    if (name.includes('CIFAR-10')) return 'from-blue-500/20 to-cyan-500/10 border-blue-500/30';
    if (name.includes('Fashion')) return 'from-pink-500/20 to-rose-500/10 border-pink-500/30';
    if (name.includes('MNIST')) return 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30';
    if (name.includes('EuroSAT')) return 'from-indigo-500/20 to-purple-500/10 border-indigo-500/30';
    if (name.includes('Blood')) return 'from-rose-500/20 to-red-500/10 border-red-500/30';
    if (name.includes('SVHN')) return 'from-yellow-500/20 to-amber-500/10 border-yellow-500/30';
    return 'from-blue-500/20 to-cyan-500/10 border-blue-500/30';
  };

  const getSamplePalette = (index: number) => {
    const palettes = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#6366F1', '#14B8A6'
    ];
    return palettes[index % palettes.length];
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="ws-panel w-full max-w-2xl bg-[var(--surface-elevated)] border border-[var(--border-strong)] shadow-2xl rounded-xl overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className={`p-5 bg-gradient-to-r ${getDatasetColor(dataset.name)} border-b border-[var(--border)] flex items-start justify-between`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-[var(--surface-secondary)] text-[var(--accent)] border border-[var(--border)]">
                {dataset.is_custom ? 'CUSTOM UPLOAD' : 'VERIFIED BENCHMARK'}
              </span>
              <span className="text-xs font-mono text-[var(--text-secondary)]">
                {dataset.resolution} &bull; {dataset.channels === 1 ? 'Grayscale (1-ch)' : 'RGB (3-ch)'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Database className="w-5 h-5 text-[var(--accent)]" />
              <span>{dataset.name}</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-lg">
              {dataset.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="ws-panel p-3 text-center">
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Classes Count</div>
              <div className="text-lg font-bold text-[var(--accent)] mt-0.5 font-mono">{dataset.classes_count}</div>
            </div>
            <div className="ws-panel p-3 text-center">
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Train Samples</div>
              <div className="text-lg font-bold text-[var(--success)] mt-0.5 font-mono">{dataset.train_samples.toLocaleString()}</div>
            </div>
            <div className="ws-panel p-3 text-center">
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Test Samples</div>
              <div className="text-lg font-bold text-[var(--text-primary)] mt-0.5 font-mono">{dataset.test_samples.toLocaleString()}</div>
            </div>
            <div className="ws-panel p-3 text-center">
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Total Images</div>
              <div className="text-lg font-bold text-[var(--text-secondary)] mt-0.5 font-mono">
                {(dataset.train_samples + dataset.test_samples).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Class Breakdown & Visual Chips */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Class Taxonomy &amp; Categories ({dataset.classes ? dataset.classes.length : dataset.classes_count})</span>
              </span>
              <span className="text-[var(--text-muted)]">Uniform Class Balance</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {dataset.classes && dataset.classes.length > 0 ? (
                dataset.classes.slice(0, 15).map((cls, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center gap-2 hover:border-[var(--accent)] transition"
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: getSamplePalette(idx) }}
                    />
                    <div className="truncate text-xs font-medium text-[var(--text-primary)] font-sans">
                      {cls}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-xs text-[var(--text-muted)] italic font-mono py-2">
                  {dataset.classes_count} standard visual classes partitioned uniformly across train/test splits.
                </div>
              )}
            </div>
            {dataset.classes && dataset.classes.length > 15 && (
              <div className="text-[11px] font-mono text-[var(--text-muted)] text-center pt-1">
                + {dataset.classes.length - 15} additional fine-grained visual categories
              </div>
            )}
          </div>

          {/* Evaluation Guarantees */}
          <div className="p-3.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)] font-mono">
              <Shield className="w-4 h-4 text-[var(--success)]" />
              <span>Scientific Parity &amp; Benchmark Guarantees</span>
            </div>
            <ul className="text-xs text-[var(--text-secondary)] space-y-1.5 font-mono list-disc list-inside">
              <li>Deterministic test split evaluation partition across all 10 metaheuristics.</li>
              <li>Input tensor dimensions pre-scaled to exactly <strong className="text-[var(--accent)]">{dataset.resolution}</strong>.</li>
              <li>Fair batch size inference forward passes with zero intra-run data leakage.</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[var(--surface-secondary)] border-t border-[var(--border)] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 ws-button-secondary text-xs"
          >
            Close Preview
          </button>

          {onSelectForBenchmark && (
            <button
              onClick={() => {
                onSelectForBenchmark(dataset);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 ws-button-primary text-xs font-semibold"
            >
              <Sparkles className="w-4 h-4" />
              <span>Configure Benchmark With {dataset.name}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
