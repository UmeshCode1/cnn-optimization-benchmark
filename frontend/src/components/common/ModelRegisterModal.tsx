import React, { useState } from 'react';
import { Cpu, X, CheckCircle2, AlertCircle, Layers } from 'lucide-react';
import { api } from '../../services/api';
import { CNNModelInfo } from '../../types';

interface ModelRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModelAdded: (model: CNNModelInfo) => void;
}

export const ModelRegisterModal: React.FC<ModelRegisterModalProps> = ({
  isOpen,
  onClose,
  onModelAdded,
}) => {
  const [name, setName] = useState('');
  const [parametersM, setParametersM] = useState(3.5);
  const [flopsM, setFlopsM] = useState(250.0);
  const [baseAccuracy, setBaseAccuracy] = useState(90.5);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Model Name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.registerModel({
        name: name.trim(),
        parameters_m: Number(parametersM),
        flops_m: Number(flopsM),
        base_accuracy: Number(baseAccuracy),
        description: description.trim() || 'Custom CNN Model Architecture',
      });
      onModelAdded(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to register CNN model');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Register Custom CNN Model</h3>
              <p className="text-xs text-slate-400">Add custom CNN architecture specification</p>
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
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">
              Model Architecture Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., SqueezeNet-Custom, MobileViT-V3"
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Dense Params (M)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={parametersM}
                onChange={(e) => setParametersM(parseFloat(e.target.value) || 1.0)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Compute FLOPs (MFLOPs)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={flopsM}
                onChange={(e) => setFlopsM(parseFloat(e.target.value) || 100.0)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">Baseline FP32 Accuracy (%)</label>
            <input
              type="number"
              step="0.1"
              min="10.0"
              max="100.0"
              value={baseAccuracy}
              onChange={(e) => setBaseAccuracy(parseFloat(e.target.value) || 90.0)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Architecture design principles, depth, kernel configs..."
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

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
              disabled={isSubmitting || !name.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition"
            >
              {isSubmitting ? (
                <span>Registering...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Register CNN Model</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
