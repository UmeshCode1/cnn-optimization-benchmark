import React, { useState, useEffect } from 'react';
import { Database, Plus, Trash2, Layers, CheckCircle2, HardDrive, FileText, Sparkles, AlertCircle } from 'lucide-react';
import { DatasetInfo } from '../../types';
import { api } from '../../services/api';
import { DatasetUploadModal } from '../common/DatasetUploadModal';

interface DatasetsViewProps {
  onSelectDatasetForBenchmark?: (dataset: DatasetInfo) => void;
}

export const DatasetsView: React.FC<DatasetsViewProps> = ({ onSelectDatasetForBenchmark }) => {
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDatasets = async () => {
    try {
      setIsLoading(true);
      const data = await api.listDatasets();
      setDatasets(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load datasets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleDelete = async (datasetId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete custom dataset "${name}"?`)) {
      return;
    }
    try {
      await api.deleteDataset(datasetId);
      setDatasets((prev) => prev.filter((d) => d.id !== datasetId));
    } catch (err: any) {
      alert(`Failed to delete dataset: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="lab-card p-6 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-900/80 text-indigo-300 border border-indigo-600/40">
              DATASET REPOSITORY
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">Benchmark Datasets & Custom Data Repository</h2>
          <p className="text-xs text-slate-300">
            Manage standardized research computer vision datasets or upload custom image collections for metaheuristic evaluation.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-500/20 transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Custom Dataset</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Dataset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {datasets.map((dataset) => (
          <div
            key={dataset.id}
            className={`lab-card p-5 flex flex-col justify-between transition-all duration-200 ${
              dataset.is_custom ? 'border-indigo-500/40 hover:border-indigo-400' : 'hover:border-blue-500/40'
            }`}
          >
            <div className="space-y-3">
              {/* Card Top */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-lg ${
                      dataset.is_custom
                        ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400'
                        : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
                    }`}
                  >
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{dataset.name}</h3>
                    <span className="text-[11px] font-mono text-slate-400">{dataset.resolution}</span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                    dataset.is_custom
                      ? 'bg-purple-900/60 text-purple-300 border border-purple-600/40'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {dataset.is_custom ? 'CUSTOM UPLOAD' : 'STANDARD'}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{dataset.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/40 text-center font-mono">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Classes</div>
                  <div className="text-xs font-bold text-slate-200">{dataset.classes_count}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Train Set</div>
                  <div className="text-xs font-bold text-emerald-400">{dataset.train_samples.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Test Set</div>
                  <div className="text-xs font-bold text-cyan-400">{dataset.test_samples.toLocaleString()}</div>
                </div>
              </div>

              {/* Classes Preview */}
              {dataset.classes && dataset.classes.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-mono text-slate-400">Class Preview:</div>
                  <div className="flex flex-wrap gap-1">
                    {dataset.classes.slice(0, 6).map((cls, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-[10px] text-slate-300"
                      >
                        {cls}
                      </span>
                    ))}
                    {dataset.classes.length > 6 && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800/50 text-[10px] text-slate-500 font-mono">
                        +{dataset.classes.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80">
              {dataset.is_custom ? (
                <button
                  onClick={() => handleDelete(dataset.id, dataset.name)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium border border-rose-500/20 transition"
                  title="Delete Custom Dataset"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-500 italic">Built-in Benchmark</span>
              )}

              {onSelectDatasetForBenchmark && (
                <button
                  onClick={() => onSelectDatasetForBenchmark(dataset)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-sm"
                >
                  <span>Use in Benchmark</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dataset Upload Modal */}
      <DatasetUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDatasetUploaded={(newDs) => {
          setDatasets((prev) => [...prev, newDs]);
        }}
      />
    </div>
  );
};
