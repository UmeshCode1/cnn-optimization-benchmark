import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, FileArchive, Layers, Info } from 'lucide-react';
import { api } from '../../services/api';
import { DatasetInfo } from '../../types';

interface DatasetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetUploaded: (dataset: DatasetInfo) => void;
}

export const DatasetUploadModal: React.FC<DatasetUploadModalProps> = ({
  isOpen,
  onClose,
  onDatasetUploaded,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState('');
  const [description, setDescription] = useState('');
  const [resolution, setResolution] = useState('32x32x3');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (selectedFile: File) => {
    const validExtensions = ['.zip', '.tar.gz', '.tar', '.csv'];
    const lowerName = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isValid) {
      setError('Please select a valid dataset archive (.zip, .tar.gz, or .csv)');
      return;
    }

    setError(null);
    setFile(selectedFile);
    if (!datasetName) {
      const stem = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setDatasetName(stem.charAt(0).toUpperCase() + stem.slice(1));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a dataset file to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (datasetName.trim()) {
        formData.append('dataset_name', datasetName.trim());
      }
      if (description.trim()) {
        formData.append('description', description.trim());
      }
      formData.append('resolution', resolution);

      const created = await api.uploadDataset(formData);
      onDatasetUploaded(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload dataset');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Upload Custom Dataset</h3>
              <p className="text-xs text-slate-400">Upload your image archive or CSV data for custom CNN benchmarks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drag and Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
              dragActive
                ? 'border-blue-500 bg-blue-500/10'
                : file
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-slate-700 hover:border-slate-500 bg-slate-800/40 hover:bg-slate-800/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,.tar.gz,.tar,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div className="space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="font-medium text-slate-200 text-sm">{file.name}</div>
                <div className="text-xs text-slate-400">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-slate-800 text-slate-400 flex items-center justify-center">
                  <FileArchive className="w-5 h-5" />
                </div>
                <div className="text-sm font-medium text-slate-200">
                  Click to browse or drag & drop dataset archive
                </div>
                <div className="text-xs text-slate-400">
                  Supports .zip, .tar.gz (with class subfolders) or .csv
                </div>
              </div>
            )}
          </div>

          {/* Dataset Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Dataset Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              placeholder="e.g., Medical Chest X-Ray 2026"
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Input Resolution */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Input Resolution</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="32x32x3">32x32x3 (CIFAR Scale)</option>
                <option value="64x64x3">64x64x3 (Medium)</option>
                <option value="128x128x3">128x128x3 (Large)</option>
                <option value="224x224x3">224x224x3 (ImageNet Standard)</option>
                <option value="28x28x1">28x28x1 (Grayscale)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Default Split</label>
              <input
                type="text"
                value="80% Train / 20% Test"
                disabled
                className="w-full px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-400 text-xs cursor-not-allowed"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Dataset details, source notes, or class breakdown..."
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Info Banner */}
          <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center gap-2 text-blue-300 text-[11px]">
            <Info className="w-4 h-4 shrink-0 text-blue-400" />
            <span>
              Archive folder names will automatically be mapped as target class categories.
            </span>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || isUploading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md transition"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Uploading & Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload & Register</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
