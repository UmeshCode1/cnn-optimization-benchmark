import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  Cpu,
  Layers,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Sliders,
  Database,
  ArrowRight,
  ArrowLeft,
  Upload,
  Plus,
} from 'lucide-react';
import { HardwareProfile, DatasetInfo } from '../../types';
import { api } from '../../services/api';
import { DatasetUploadModal } from '../common/DatasetUploadModal';

interface NewBenchmarkWizardProps {
  hardware?: HardwareProfile;
  onSubmitBenchmark: (config: any) => void;
  onCancel: () => void;
}

const ALL_ALGORITHMS = [
  { key: 'GWO', name: 'Grey Wolf Optimizer', category: 'Swarm' },
  { key: 'WOA', name: 'Whale Optimization Algorithm', category: 'Swarm' },
  { key: 'ALO', name: 'Ant Lion Optimizer', category: 'Swarm' },
  { key: 'MFO', name: 'Moth-Flame Optimization', category: 'Physics' },
  { key: 'GOA', name: 'Grasshopper Optimization Algorithm', category: 'Swarm' },
  { key: 'MVO', name: 'Multi-Verse Optimizer', category: 'Physics' },
  { key: 'SCA', name: 'Sine Cosine Algorithm', category: 'Trigonometric' },
  { key: 'AOA', name: 'Arithmetic Optimization Algorithm', category: 'Mathematical' },
  { key: 'MGO', name: 'Mountain Gazelle Optimizer', category: 'Swarm' },
  { key: 'GMO', name: 'Geometric Mean Optimizer', category: 'Mathematical' },
];

export const NewBenchmarkWizard: React.FC<NewBenchmarkWizardProps> = ({
  hardware,
  onSubmitBenchmark,
  onCancel,
}) => {
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [fairnessStatus, setFairnessStatus] = useState<any>(null);
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    title: 'ResNet-18 Benchmark on CIFAR-10',
    description: 'Comprehensive comparative evaluation across 10 metaheuristic optimizers.',
    preset: 'STANDARD',
    is_demo: false,

    // Step 1: Dataset
    dataset_name: 'CIFAR-10',
    dataset_split: 'train:50000,test:10000',
    input_resolution: '32x32x3',
    batch_size: 128,

    // Step 2: CNN
    cnn_model_name: 'ResNet-18',
    checkpoint_name: 'torchvision_pretrained',

    // Step 3: Quantization
    quantization_type: 'INT8',

    // Step 4: Pruning
    pruning_method: 'STRUCTURED_CHANNEL',
    pruning_ratio: 0.40,

    // Step 5: Algorithms
    selected_algorithms: ['GWO', 'WOA', 'ALO', 'MFO', 'GOA', 'MVO', 'SCA', 'AOA', 'MGO', 'GMO'],

    // Step 6: Search
    population_size: 20,
    max_iterations: 30,

    // Step 7: Evaluation & Weights
    number_of_runs: 5,
    random_seed_policy: 'FIXED_PER_RUN',
    base_seed: 42,
    warmup_runs: 50,
    measured_runs: 200,

    // Weights
    weight_accuracy: 0.40,
    weight_latency: 0.25,
    weight_model_size: 0.20,
    weight_energy: 0.15,
  });

  useEffect(() => {
    api.listDatasets().then(setDatasets).catch(() => {});
  }, []);

  const applyPreset = (presetName: string) => {
    if (presetName === 'QUICK_TEST') {
      setFormData((prev) => ({
        ...prev,
        preset: 'QUICK_TEST',
        number_of_runs: 1,
        population_size: 10,
        max_iterations: 10,
        warmup_runs: 10,
        measured_runs: 50,
      }));
    } else if (presetName === 'STANDARD') {
      setFormData((prev) => ({
        ...prev,
        preset: 'STANDARD',
        number_of_runs: 5,
        population_size: 20,
        max_iterations: 30,
        warmup_runs: 50,
        measured_runs: 200,
      }));
    } else if (presetName === 'RESEARCH') {
      setFormData((prev) => ({
        ...prev,
        preset: 'RESEARCH',
        number_of_runs: 10,
        population_size: 30,
        max_iterations: 50,
        warmup_runs: 100,
        measured_runs: 500,
      }));
    }
  };

  const handleSelectAllAlgs = () => {
    setFormData((prev) => ({
      ...prev,
      selected_algorithms: ALL_ALGORITHMS.map((a) => a.key),
    }));
  };

  const handleClearAllAlgs = () => {
    setFormData((prev) => ({
      ...prev,
      selected_algorithms: [],
    }));
  };

  const toggleAlgorithm = (key: string) => {
    setFormData((prev) => {
      const exists = prev.selected_algorithms.includes(key);
      const updated = exists
        ? prev.selected_algorithms.filter((k) => k !== key)
        : [...prev.selected_algorithms, key];
      return { ...prev, selected_algorithms: updated };
    });
  };

  const handleValidateFairness = async () => {
    try {
      const res = await api.validateFairness(formData);
      setFairnessStatus(res);
    } catch (err: any) {
      alert(`Fairness validation error: ${err.message}`);
    }
  };

  const handleSubmit = async () => {
    if (formData.selected_algorithms.length === 0) {
      alert('Please select at least one optimization algorithm.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmitBenchmark(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalWeight =
    formData.weight_accuracy +
    formData.weight_latency +
    formData.weight_model_size +
    formData.weight_energy;
  const isWeightValid = Math.abs(totalWeight - 1.0) < 0.01;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Wizard Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 tracking-wide flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-blue-500" />
            CREATE NEW CNN BENCHMARK EXPERIMENT
          </h2>
          <p className="text-xs text-slate-400">
            Configure identical dataset, model, and experimental constraints to compare 10 metaheuristics under fair conditions.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Benchmark Preset:</span>
          {['QUICK_TEST', 'STANDARD', 'RESEARCH'].map((p) => (
            <button
              key={p}
              onClick={() => applyPreset(p)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition border ${
                formData.preset === p
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {p.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Form Steps on Left, Persistent Summary on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Step Wizard */}
        <div className="lg:col-span-2 space-y-5">
          {/* Step Breadcrumb Bar */}
          <div className="flex items-center justify-between bg-slate-900/90 p-2 rounded-lg border border-slate-800 overflow-x-auto text-xs font-mono">
            {[
              { num: 1, label: '1. Dataset' },
              { num: 2, label: '2. CNN Model' },
              { num: 3, label: '3. Quantization' },
              { num: 4, label: '4. Pruning' },
              { num: 5, label: '5. Algorithms' },
              { num: 6, label: '6. Evaluation' },
            ].map((s) => (
              <button
                key={s.num}
                onClick={() => setStep(s.num)}
                className={`px-3 py-1.5 rounded transition whitespace-nowrap ${
                  step === s.num
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Step 1: Dataset */}
          {step === 1 && (
            <div className="lab-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Step 1: Dataset Selection
                </h3>
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload Custom Dataset</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {datasets.map((d) => (
                  <div
                    key={d.id}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        dataset_name: d.name,
                        dataset_split: `train:${d.train_samples},test:${d.test_samples}`,
                        input_resolution: d.resolution,
                      })
                    }
                    className={`p-3.5 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                      formData.dataset_name === d.name
                        ? 'bg-blue-950/50 border-blue-500 text-slate-100 shadow-sm'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-200">{d.name}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                            d.is_custom
                              ? 'bg-purple-900/50 text-purple-300 border border-purple-600/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {d.is_custom ? 'CUSTOM' : `${d.classes_count} CLS`}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {d.train_samples.toLocaleString()} train &bull; {d.test_samples.toLocaleString()} test
                      </div>
                    </div>
                    <div className="text-[11px] font-mono text-cyan-400 mt-2">
                      Resolution: {d.resolution}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Batch Size:</label>
                  <input
                    type="number"
                    value={formData.batch_size}
                    onChange={(e) => setFormData({ ...formData, batch_size: parseInt(e.target.value) || 128 })}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Input Resolution:</label>
                  <input
                    type="text"
                    value={formData.input_resolution}
                    onChange={(e) => setFormData({ ...formData, input_resolution: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: CNN Model */}
          {step === 2 && (
            <div className="lab-card p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Step 2: Target CNN Model</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'ResNet-18', params: '11.17M', flops: '556 MFLOPs', baseAcc: '93.4%' },
                  { name: 'MobileNetV2', params: '2.23M', flops: '314 MFLOPs', baseAcc: '91.8%' },
                  { name: 'ShuffleNetV2', params: '1.36M', flops: '149 MFLOPs', baseAcc: '89.4%' },
                  { name: 'SimpleCNN', params: '0.85M', flops: '88 MFLOPs', baseAcc: '86.2%' },
                  { name: 'VGG-16', params: '14.72M', flops: '313 MFLOPs', baseAcc: '92.6%' },
                  { name: 'EfficientNet-B0', params: '4.02M', flops: '390 MFLOPs', baseAcc: '92.9%' },
                ].map((m) => (
                  <div
                    key={m.name}
                    onClick={() => setFormData({ ...formData, cnn_model_name: m.name })}
                    className={`p-3.5 rounded-lg border cursor-pointer transition ${
                      formData.cnn_model_name === m.name
                        ? 'bg-blue-950/50 border-blue-500 text-slate-100 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-200">{m.name}</div>
                    <div className="text-xs text-slate-400 mt-1">Params: {m.params} &bull; FLOPs: {m.flops}</div>
                    <div className="text-[11px] font-mono text-emerald-400 mt-1">Baseline Acc: {m.baseAcc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Quantization */}
          {step === 3 && (
            <div className="lab-card p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Step 3: Quantization Protocol</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: 'FP32', desc: 'Full 32-bit floating point precision (no compression)', factor: '1.0x', bits: 32 },
                  { type: 'FP16', desc: '16-bit half precision float using Tensor Cores', factor: '2.0x', bits: 16 },
                  { type: 'INT8', desc: '8-bit signed integer post-training calibration (PTQ)', factor: '4.0x', bits: 8 },
                  { type: 'INT8_DYNAMIC', desc: 'Dynamic activation quantization at runtime', factor: '4.0x', bits: 8 },
                ].map((q) => (
                  <div
                    key={q.type}
                    onClick={() => setFormData({ ...formData, quantization_type: q.type })}
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      formData.quantization_type === q.type
                        ? 'bg-blue-950/50 border-blue-500 text-slate-100'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-200">{q.type}</div>
                    <div className="text-xs text-slate-400 mt-1">{q.desc}</div>
                    <div className="text-[11px] font-mono text-cyan-400 mt-1">
                      {q.bits}-bit &bull; Compression Factor: {q.factor}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Pruning */}
          {step === 4 && (
            <div className="lab-card p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Step 4: Pruning Configuration</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: 'STRUCTURED_CHANNEL', label: 'Structured Channel Pruning', desc: 'L1-norm channel removal (Direct hardware speedup)' },
                  { type: 'STRUCTURED_FILTER', label: 'Structured Filter Pruning', desc: '2D filter tensor dimension reduction' },
                  { type: 'UNSTRUCTURED', label: 'Unstructured Magnitude Pruning', desc: 'Sparse zero weights (tensor shapes preserved)' },
                  { type: 'NONE', label: 'No Pruning', desc: 'Preserves 100% of dense CNN parameters' },
                ].map((p) => (
                  <div
                    key={p.type}
                    onClick={() => setFormData({ ...formData, pruning_method: p.type })}
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      formData.pruning_method === p.type
                        ? 'bg-blue-950/50 border-blue-500 text-slate-100'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-200">{p.label}</div>
                    <div className="text-xs text-slate-400 mt-1">{p.desc}</div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-800">
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                  <span>Pruning Sparsity Ratio:</span>
                  <span className="font-bold text-blue-400">{(formData.pruning_ratio * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.90"
                  step="0.05"
                  value={formData.pruning_ratio}
                  onChange={(e) => setFormData({ ...formData, pruning_ratio: parseFloat(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Step 5: Algorithms */}
          {step === 5 && (
            <div className="lab-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Step 5: Select Optimization Algorithms ({formData.selected_algorithms.length}/10 Selected)
                </h3>
                <div className="flex gap-2 text-xs">
                  <button onClick={handleSelectAllAlgs} className="text-blue-400 hover:underline">Select All</button>
                  <span className="text-slate-600">&bull;</span>
                  <button onClick={handleClearAllAlgs} className="text-slate-400 hover:underline">Clear All</button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {ALL_ALGORITHMS.map((alg) => {
                  const isChecked = formData.selected_algorithms.includes(alg.key);
                  return (
                    <div
                      key={alg.key}
                      onClick={() => toggleAlgorithm(alg.key)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition select-none flex flex-col justify-between ${
                        isChecked
                          ? 'bg-blue-950/50 border-blue-500 text-slate-100 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold font-mono text-sm">{alg.key}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-blue-600"
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-1">{alg.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 6: Evaluation & Weights */}
          {step === 6 && (
            <div className="lab-card p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Step 6: Evaluation &amp; Multi-Objective Weights</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Repetitions (Runs):</label>
                  <select
                    value={formData.number_of_runs}
                    onChange={(e) => setFormData({ ...formData, number_of_runs: parseInt(e.target.value) || 5 })}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs font-mono text-slate-200"
                  >
                    <option value="1">1 Run (Fast Preview)</option>
                    <option value="3">3 Runs (Standard)</option>
                    <option value="5">5 Runs (Statistical)</option>
                    <option value="10">10 Runs (Rigorous)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Population Size &bull; Max Iter:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={formData.population_size}
                      onChange={(e) => setFormData({ ...formData, population_size: parseInt(e.target.value) || 20 })}
                      className="bg-slate-900 border border-slate-800 rounded p-2 text-xs font-mono text-slate-200"
                    />
                    <input
                      type="number"
                      value={formData.max_iterations}
                      onChange={(e) => setFormData({ ...formData, max_iterations: parseInt(e.target.value) || 30 })}
                      className="bg-slate-900 border border-slate-800 rounded p-2 text-xs font-mono text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Weight Sliders */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-200">Objective Weights Distribution:</span>
                  <span className={`font-mono font-bold ${isWeightValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                    Sum: {(totalWeight * 100).toFixed(0)}% {isWeightValid ? '✓' : '(Must equal 100%)'}
                  </span>
                </div>

                {[
                  { label: 'Accuracy Weight', key: 'weight_accuracy', val: formData.weight_accuracy, color: 'accent-blue' },
                  { label: 'Latency Weight', key: 'weight_latency', val: formData.weight_latency, color: 'accent-cyan' },
                  { label: 'Model Size Weight', key: 'weight_model_size', val: formData.weight_model_size, color: 'accent-emerald' },
                  { label: 'Energy Weight', key: 'weight_energy', val: formData.weight_energy, color: 'accent-amber' },
                ].map((w) => (
                  <div key={w.key} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono text-slate-300">
                      <span>{w.label}</span>
                      <span className="font-bold">{(w.val * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1.0"
                      step="0.05"
                      value={w.val}
                      onChange={(e) => setFormData({ ...formData, [w.key]: parseFloat(e.target.value) })}
                      className="w-full cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => (step > 1 ? setStep(step - 1) : onCancel())}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{step > 1 ? 'Previous Step' : 'Cancel'}</span>
            </button>

            {step < 6 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition"
              >
                <span>Next Step</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleValidateFairness}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Verify Fairness Protocol</span>
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isWeightValid || formData.selected_algorithms.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Launch Benchmark Experiment</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Persistent Experiment Configuration Summary */}
        <div className="space-y-4">
          <div className="lab-card p-5 space-y-4 sticky top-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
              Experiment Manifest
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Dataset:</span>
                <span className="font-mono font-bold text-slate-200">{formData.dataset_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Resolution:</span>
                <span className="font-mono text-slate-300">{formData.input_resolution}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">CNN Model:</span>
                <span className="font-mono font-bold text-blue-400">{formData.cnn_model_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Quantization:</span>
                <span className="font-mono text-cyan-400">{formData.quantization_type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Pruning Sparsity:</span>
                <span className="font-mono text-emerald-400">{(formData.pruning_ratio * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Algorithms:</span>
                <span className="font-mono font-bold text-indigo-400">{formData.selected_algorithms.length} / 10</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Runs &bull; Population:</span>
                <span className="font-mono text-slate-300">{formData.number_of_runs} runs &bull; pop {formData.population_size}</span>
              </div>
            </div>

            {/* Fairness verification results if tested */}
            {fairnessStatus && (
              <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Fairness Protocol Verified</span>
                </div>
                <p className="text-[11px] text-slate-300">{fairnessStatus.message}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dataset Upload Modal */}
      <DatasetUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDatasetUploaded={(newDs) => {
          setDatasets((prev) => [...prev, newDs]);
          setFormData((prev) => ({
            ...prev,
            dataset_name: newDs.name,
            dataset_split: `train:${newDs.train_samples},test:${newDs.test_samples}`,
            input_resolution: newDs.resolution,
          }));
        }}
      />
    </div>
  );
};
