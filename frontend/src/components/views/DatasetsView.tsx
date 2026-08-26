import React, { useState, useEffect } from 'react';
import { Database, Plus, Trash2, CheckCircle2, AlertCircle, Layers } from 'lucide-react';
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
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
        <div>
          <h2 className="ws-page-title">Dataset Repository</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Standardized computer vision evaluation datasets and verified custom image archives.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 ws-button-primary text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Upload Custom Dataset</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded bg-[var(--danger)]/10 border border-[var(--danger)]/30 flex items-center gap-2.5 text-[var(--danger)] text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Dataset Repository Table */}
      <div className="ws-panel p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="ws-section-title">Available Benchmark Datasets ({datasets.length})</h3>
          <span className="text-xs font-mono text-[var(--text-muted)]">Verified Image Archives</span>
        </div>

        <div className="overflow-x-auto">
          <table className="ws-table font-mono text-xs">
            <thead>
              <tr>
                <th>Dataset Name</th>
                <th>Resolution</th>
                <th className="text-right">Classes</th>
                <th className="text-right">Train Split</th>
                <th className="text-right">Test Split</th>
                <th>Repository Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((dataset) => (
                <tr key={dataset.id}>
                  <td className="font-bold text-[var(--text-primary)] font-sans">
                    <div className="flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <span>{dataset.name}</span>
                    </div>
                  </td>
                  <td className="text-[var(--text-secondary)]">{dataset.resolution}</td>
                  <td className="text-right text-[var(--text-primary)]">{dataset.classes_count}</td>
                  <td className="text-right text-[var(--success)]">{dataset.train_samples.toLocaleString()}</td>
                  <td className="text-right text-[var(--text-primary)]">{dataset.test_samples.toLocaleString()}</td>
                  <td>
                    {dataset.is_custom ? (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/30">
                        CUSTOM
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/30">
                        VERIFIED
                      </span>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2 font-sans">
                      {onSelectDatasetForBenchmark && (
                        <button
                          onClick={() => onSelectDatasetForBenchmark(dataset)}
                          className="text-xs text-[var(--accent)] hover:underline font-medium"
                        >
                          Use in Benchmark
                        </button>
                      )}
                      {dataset.is_custom && (
                        <button
                          onClick={() => handleDelete(dataset.id, dataset.name)}
                          className="p-1 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded transition-colors"
                          title="Delete Dataset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
