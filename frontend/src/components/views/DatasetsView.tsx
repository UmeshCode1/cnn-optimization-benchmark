import React, { useState, useEffect } from 'react';
import { Database, Plus, Trash2, CheckCircle2, AlertCircle, Layers, Search, Filter, Sparkles, Eye } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'STANDARD' | 'SATELLITE' | 'BIOMEDICAL' | 'CUSTOM'>('ALL');
  const [selectedDatasetDetail, setSelectedDatasetDetail] = useState<DatasetInfo | null>(null);

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

  const filteredDatasets = datasets.filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      (d.classes && d.classes.some((c) => c.toLowerCase().includes(q)));

    if (!matchesSearch) return false;

    if (categoryFilter === 'ALL') return true;
    if (categoryFilter === 'CUSTOM') return d.is_custom;
    if (categoryFilter === 'SATELLITE') return d.id.includes('eurosat');
    if (categoryFilter === 'BIOMEDICAL') return d.id.includes('blood') || d.id.includes('med');
    if (categoryFilter === 'STANDARD') return !d.is_custom && !d.id.includes('eurosat') && !d.id.includes('blood');
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="ws-page-title">Dataset Repository</h2>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
              {datasets.length} Active Datasets
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Standardized computer vision evaluation datasets, biomedical morphology archives, and custom uploads.
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

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 ws-panel p-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search datasets by name, classes, or domain..."
            className="w-full ws-input pl-9 pr-3 py-1.5 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs overflow-x-auto">
          {[
            { key: 'ALL', label: 'All' },
            { key: 'STANDARD', label: 'General Vision' },
            { key: 'SATELLITE', label: 'Satellite' },
            { key: 'BIOMEDICAL', label: 'Biomedical' },
            { key: 'CUSTOM', label: 'Custom Uploads' },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategoryFilter(cat.key as any)}
              className={`px-2.5 py-1 rounded transition border ${
                categoryFilter === cat.key
                  ? 'bg-[var(--surface-elevated)] border-[var(--accent)] text-[var(--accent)] font-semibold'
                  : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dataset Repository Table */}
      <div className="ws-panel p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="ws-section-title">Verified Computer Vision Archives ({filteredDatasets.length})</h3>
          <span className="text-xs font-mono text-[var(--text-muted)]">Image Classification Datasets</span>
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
                <th>Class Labels Preview</th>
                <th>Repository Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDatasets.map((dataset) => (
                <tr key={dataset.id}>
                  <td className="font-bold text-[var(--text-primary)] font-sans">
                    <div className="flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <div>
                        <span>{dataset.name}</span>
                        <p className="text-[11px] text-[var(--text-muted)] font-normal max-w-xs truncate">
                          {dataset.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="text-[var(--text-secondary)]">{dataset.resolution}</td>
                  <td className="text-right text-[var(--text-primary)] font-semibold">{dataset.classes_count}</td>
                  <td className="text-right text-[var(--success)]">{dataset.train_samples.toLocaleString()}</td>
                  <td className="text-right text-[var(--text-primary)]">{dataset.test_samples.toLocaleString()}</td>
                  <td className="max-w-[200px]">
                    <div className="flex flex-wrap gap-1">
                      {dataset.classes && dataset.classes.slice(0, 3).map((cls, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--text-muted)] border border-[var(--border)] text-[10px]"
                        >
                          {cls}
                        </span>
                      ))}
                      {dataset.classes && dataset.classes.length > 3 && (
                        <span className="text-[10px] text-[var(--text-muted)] self-center">
                          +{dataset.classes.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
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
                      <button
                        onClick={() => setSelectedDatasetDetail(dataset)}
                        className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                      {onSelectDatasetForBenchmark && (
                        <button
                          onClick={() => onSelectDatasetForBenchmark(dataset)}
                          className="flex items-center gap-1 text-xs text-[var(--accent)] hover:underline font-medium"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Use in Benchmark</span>
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

      {/* Dataset Preview Modal */}
      <DatasetPreviewModal
        isOpen={!!selectedDatasetDetail}
        dataset={selectedDatasetDetail}
        onClose={() => setSelectedDatasetDetail(null)}
        onSelectForBenchmark={onSelectDatasetForBenchmark}
      />

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
