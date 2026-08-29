import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  Cpu,
  Layers,
  ShieldCheck,
  RotateCcw,
  Sliders,
  Database,
  ArrowRight,
  ArrowLeft,
  Plus,
  Sparkles,
} from 'lucide-react';
import { HardwareProfile, DatasetInfo, CNNModelInfo, AlgorithmMeta } from '../../types';
import { api } from '../../services/api';
import { DatasetUploadModal } from '../common/DatasetUploadModal';
import { ModelRegisterModal } from '../common/ModelRegisterModal';
import { AlgorithmUploadModal } from '../common/AlgorithmUploadModal';

const DEFAULT_DATASETS: DatasetInfo[] = [
  { id: 'cifar-10', name: 'CIFAR-10', is_custom: false, classes_count: 10, classes: [], train_samples: 50000, test_samples: 10000, resolution: '32x32x3', channels: 3, description: 'Standard 10-class benchmark dataset', created_at: '' },
  { id: 'cifar-100', name: 'CIFAR-100', is_custom: false, classes_count: 100, classes: [], train_samples: 50000, test_samples: 10000, resolution: '32x32x3', channels: 3, description: 'Fine-grained 100-class benchmark dataset', created_at: '' },
  { id: 'mnist', name: 'MNIST', is_custom: false, classes_count: 10, classes: [], train_samples: 60000, test_samples: 10000, resolution: '28x28x1', channels: 1, description: 'Handwritten digits dataset', created_at: '' },
  { id: 'fashion-mnist', name: 'Fashion-MNIST', is_custom: false, classes_count: 10, classes: [], train_samples: 60000, test_samples: 10000, resolution: '28x28x1', channels: 1, description: 'Zalando fashion benchmark dataset', created_at: '' },
  { id: 'imagenet-subset', name: 'ImageNet-1k Subset', is_custom: false, classes_count: 100, classes: [], train_samples: 50000, test_samples: 5000, resolution: '224x224x3', channels: 3, description: 'ImageNet 100-class subset', created_at: '' },
];

const DEFAULT_MODELS: CNNModelInfo[] = [
  { id: 'resnet-18', name: 'ResNet-18', parameters_m: 11.17, flops_m: 556.0, base_accuracy: 93.4, is_custom: false, description: '18-layer Residual Network standard baseline' },
  { id: 'mobilenet-v2', name: 'MobileNetV2', parameters_m: 2.23, flops_m: 314.0, base_accuracy: 91.8, is_custom: false, description: 'Inverted residual bottleneck architecture' },
  { id: 'shufflenet-v2', name: 'ShuffleNetV2', parameters_m: 1.36, flops_m: 149.0, base_accuracy: 89.4, is_custom: false, description: 'Channel shuffle architecture' },
  { id: 'simple-cnn', name: 'SimpleCNN', parameters_m: 0.85, flops_m: 88.0, base_accuracy: 86.2, is_custom: false, description: 'Compact 4-layer CNN' },
  { id: 'vgg-16', name: 'VGG-16', parameters_m: 14.72, flops_m: 313.0, base_accuracy: 92.6, is_custom: false, description: 'Classic 16-layer network' },
  { id: 'efficientnet-b0', name: 'EfficientNet-B0', parameters_m: 4.02, flops_m: 390.0, base_accuracy: 92.9, is_custom: false, description: 'Compound scaling baseline CNN' },
];

const DEFAULT_ALGORITHMS: AlgorithmMeta[] = [
  { key: 'GWO', name: 'Grey Wolf Optimizer', acronym: 'GWO', year: 2014, authors: 'Mirjalili et al.', category: 'Swarm Intelligence', description: '', strengths: [], status: 'VERIFIED' },
  { key: 'WOA', name: 'Whale Optimization Algorithm', acronym: 'WOA', year: 2016, authors: 'Mirjalili et al.', category: 'Swarm Intelligence', description: '', strengths: [], status: 'VERIFIED' },
  { key: 'ALO', name: 'Ant Lion Optimizer', acronym: 'ALO', year: 2015, authors: 'Mirjalili', category: 'Swarm Intelligence', description: '', strengths: [], status: 'VERIFIED' },
  { key: 'MFO', name: 'Moth-Flame Optimization', acronym: 'MFO', year: 2015, authors: 'Mirjalili', category: 'Physics', description: '', strengths: [], status: 'VERIFIED' },
  { key: 'GOA', name: 'Grasshopper Optimization Algorithm', acronym: 'GOA', year: 2017, authors: 'Saremi et al.', category: 'Swarm Intelligence', description: '', strengths: [], status: 'VERIFIED' },
  { key: 'MVO', name: 'Multi-Verse Optimizer', acronym: 'MVO', year: 2016, authors: 'Mirjalili et al.', category: 'Physics', description: '', strengths: [], status: 'VERIFIED' },
  { key: 'SCA', name: 'Sine Cosine Algorithm', acronym: 'SCA', year: 2016, authors: 'Mirjalili', category: 'Mathematical', description: '', strengths: [], status: 'VERIFIED' },
  { key: 'AOA', name: 'Arithmetic Optimization Algorithm', acronym: 'AOA', year: 2021, authors: 'Abualigah et al.', category: 'Mathematical', description: '', strengths: [], status: 'VERIFIED' },
  { key: 'MGO', name: 'Mountain Gazelle Optimizer', acronym: 'MGO', year: 2022, authors: 'Abdollahzadeh et al.', category: 'Swarm Intelligence', description: '', strengths: [], status: 'VERIFIED' },
  { key: 'GMO', name: 'Geometric Mean Optimizer', acronym: 'GMO', year: 2023, authors: 'Mirrashid et al.', category: 'Mathematical', description: '', strengths: [], status: 'VERIFIED' },
];

interface NewBenchmarkWizardProps {
  hardware?: HardwareProfile;
  onSubmitBenchmark: (config: any) => void;
  onCancel: () => void;
}

export const NewBenchmarkWizard: React.FC<NewBenchmarkWizardProps> = ({
  hardware,
  onSubmitBenchmark,
  onCancel,
}) => {
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [fairnessStatus, setFairnessStatus] = useState<any>(null);

  // Dynamic Data with safe defaults
  const [datasets, setDatasets] = useState<DatasetInfo[]>(DEFAULT_DATASETS);
  const [models, setModels] = useState<CNNModelInfo[]>(DEFAULT_MODELS);
  const [algorithms, setAlgorithms] = useState<AlgorithmMeta[]>(DEFAULT_ALGORITHMS);

  // Modals
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState<boolean>(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState<boolean>(false);
  const [isAlgorithmModalOpen, setIsAlgorithmModalOpen] = useState<boolean>(false);
  const [isTitleUserEdited, setIsTitleUserEdited] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    title: 'ResNet-18 INT8 Compression on CIFAR-10',
    description: 'Comprehensive comparative evaluation across metaheuristic optimizers.',
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

  const loadResources = async () => {
    try {
      const [dss, mds, algs] = await Promise.allSettled([
        api.listDatasets(),
        api.listModels(),
        api.getAlgorithms(),
      ]);
      if (dss.status === 'fulfilled' && dss.value.length > 0) setDatasets(dss.value);
      if (mds.status === 'fulfilled' && mds.value.length > 0) setModels(mds.value);
      if (algs.status === 'fulfilled' && algs.value.length > 0) setAlgorithms(algs.value);
    } catch (err) {
      console.error('Failed to load benchmark wizard resources:', err);
    }
  };

  useEffect(() => {
    loadResources();
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
      selected_algorithms: algorithms.map((a) => a.key),
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

  const wizardSteps = [
    { num: 1, label: '1. Dataset' },
    { num: 2, label: '2. CNN Architecture' },
    { num: 3, label: '3. Quantization' },
    { num: 4, label: '4. Pruning' },
    { num: 5, label: '5. Optimizers' },
    { num: 6, label: '6. Protocol & Weights' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Wizard Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
        <div>
          <h2 className="ws-page-title">Configure Benchmark Experiment</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Specify standardized dataset, CNN architecture, compression parameters, and optimizer search budgets.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="text-[var(--text-muted)] mr-1">Preset:</span>
          {['QUICK_TEST', 'STANDARD', 'RESEARCH'].map((p) => (
            <button
              key={p}
              onClick={() => applyPreset(p)}
              className={`px-2.5 py-1 rounded transition border ${
                formData.preset === p
                  ? 'bg-[var(--surface-elevated)] border-[var(--accent)] text-[var(--accent)] font-semibold'
                  : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
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
          {/* Experiment Title & Research Name Input Card */}
          <div className="ws-panel p-4 space-y-2.5 border-l-4 border-l-[var(--accent)] bg-[var(--surface-elevated)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-mono font-bold text-[var(--text-primary)] flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Experiment Name &amp; Title</span>
              </label>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                Required for tracking &amp; archive
              </span>
            </div>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => {
                setIsTitleUserEdited(true);
                setFormData({ ...formData, title: e.target.value });
              }}
              placeholder="e.g. ResNet-18 INT8 Compression on CIFAR-10"
              className="w-full ws-input px-3 py-2 text-xs font-semibold text-[var(--text-primary)] bg-[var(--surface)] border border-[var(--border-strong)] rounded-md focus:border-[var(--accent)]"
              required
            />
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional research description, hypothesis, or hardware notes..."
              className="w-full ws-input px-3 py-1.5 text-[11px] text-[var(--text-secondary)] bg-[var(--surface)] border border-[var(--border)] rounded-md"
            />
          </div>

          {/* Step Progress Bar */}
          <div className="flex items-center justify-between ws-panel p-1.5 overflow-x-auto text-xs font-mono">
            {wizardSteps.map((s) => {
              const isCurrent = step === s.num;
              const isCompleted = step > s.num;

              return (
                <button
                  key={s.num}
                  onClick={() => setStep(s.num)}
                  className={`px-3 py-1.5 rounded transition whitespace-nowrap flex items-center gap-1.5 ${
                    isCurrent
                      ? 'bg-[var(--accent)] text-white font-semibold'
                      : isCompleted
                      ? 'text-[var(--success)] hover:bg-[var(--surface-secondary)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {isCompleted && <CheckCircle2 className="w-3 h-3 text-[var(--success)]" />}
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* Step 1: Dataset Selection */}
          {step === 1 && (
            <div className="ws-panel p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="ws-section-title">Step 1: Benchmark Dataset Selection</h3>
                  <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                    Select standardized computer vision benchmark or custom image dataset.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDatasetModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 ws-button-secondary text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload Dataset</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {datasets.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => {
                      const newTitle = isTitleUserEdited
                        ? formData.title
                        : `${formData.cnn_model_name} ${formData.quantization_type} Compression on ${d.name}`;
                      setFormData({
                        ...formData,
                        title: newTitle,
                        dataset_name: d.name,
                        dataset_split: `train:${d.train_samples},test:${d.test_samples}`,
                        input_resolution: d.resolution,
                      });
                    }}
                    className={`p-3.5 rounded border cursor-pointer transition flex flex-col justify-between ${
                      formData.dataset_name === d.name
                        ? 'bg-[var(--surface-elevated)] border-[var(--accent)]'
                        : 'ws-panel text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-[var(--text-primary)] font-sans">{d.name}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                            d.is_custom
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                              : 'bg-[var(--surface-secondary)] text-[var(--text-muted)]'
                          }`}
                        >
                          {d.is_custom ? 'CUSTOM' : `${d.classes_count} Classes`}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-[var(--text-muted)] mt-1">
                        {d.train_samples.toLocaleString()} train &bull; {d.test_samples.toLocaleString()} test
                      </div>
                    </div>
                    <div className="text-[11px] font-mono text-[var(--accent)] mt-2">
                      Resolution: {d.resolution}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]">
                <div>
                  <label className="text-[11px] font-mono text-[var(--text-muted)] block mb-1">Batch Size:</label>
                  <input
                    type="number"
                    value={formData.batch_size}
                    onChange={(e) => setFormData({ ...formData, batch_size: parseInt(e.target.value) || 128 })}
                    className="w-full ws-input p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-[var(--text-muted)] block mb-1">Input Resolution:</label>
                  <input
                    type="text"
                    value={formData.input_resolution}
                    onChange={(e) => setFormData({ ...formData, input_resolution: e.target.value })}
                    className="w-full ws-input p-2 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Target CNN Model */}
          {step === 2 && (
            <div className="ws-panel p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="ws-section-title">Step 2: Target CNN Architecture</h3>
                  <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                    Select standard convolutional neural network baseline or register custom model.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModelModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 ws-button-secondary text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register Model</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {models.map((m) => (
                  <div
                    key={m.id || m.name}
                    onClick={() => {
                      const newTitle = isTitleUserEdited
                        ? formData.title
                        : `${m.name} ${formData.quantization_type} Compression on ${formData.dataset_name}`;
                      setFormData({
                        ...formData,
                        title: newTitle,
                        cnn_model_name: m.name,
                      });
                    }}
                    className={`p-3.5 rounded border cursor-pointer transition ${
                      formData.cnn_model_name === m.name
                        ? 'bg-[var(--surface-elevated)] border-[var(--accent)]'
                        : 'ws-panel text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[var(--text-primary)] font-sans">{m.name}</span>
                      {m.is_custom && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30 font-mono">
                          CUSTOM
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-[var(--text-muted)] mt-1">
                      Params: {m.parameters_m}M &bull; FLOPs: {m.flops_m} M
                    </div>
                    <div className="text-[11px] font-mono text-[var(--success)] mt-1 font-medium">
                      Baseline Acc: {m.base_accuracy}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Quantization */}
          {step === 3 && (
            <div className="ws-panel p-5 space-y-4">
              <h3 className="ws-section-title">Step 3: Quantization Protocol</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: 'FP32', desc: 'Full 32-bit floating point precision (no compression)', factor: '1.0x', bits: 32 },
                  { type: 'FP16', desc: '16-bit half precision float using Tensor Cores', factor: '2.0x', bits: 16 },
                  { type: 'INT8', desc: '8-bit signed integer post-training calibration (PTQ)', factor: '4.0x', bits: 8 },
                  { type: 'INT8_DYNAMIC', desc: 'Dynamic activation quantization at runtime', factor: '4.0x', bits: 8 },
                ].map((q) => (
                  <div
                    key={q.type}
                    onClick={() => {
                      const newTitle = isTitleUserEdited
                        ? formData.title
                        : `${formData.cnn_model_name} ${q.type} Compression on ${formData.dataset_name}`;
                      setFormData({
                        ...formData,
                        title: newTitle,
                        quantization_type: q.type,
                      });
                    }}
                    className={`p-3.5 rounded border cursor-pointer transition ${
                      formData.quantization_type === q.type
                        ? 'bg-[var(--surface-elevated)] border-[var(--accent)]'
                        : 'ws-panel text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="font-semibold text-xs text-[var(--text-primary)] font-mono">{q.type}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-1 font-sans">{q.desc}</div>
                    <div className="text-[11px] font-mono text-[var(--accent)] mt-2">
                      {q.bits}-bit &bull; Compression Factor: {q.factor}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Pruning */}
          {step === 4 && (
            <div className="ws-panel p-5 space-y-4">
              <h3 className="ws-section-title">Step 4: Pruning Configuration</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: 'STRUCTURED_CHANNEL', label: 'Structured Channel Pruning', desc: 'L1-norm channel removal for hardware speedup' },
                  { type: 'STRUCTURED_FILTER', label: 'Structured Filter Pruning', desc: '2D filter tensor dimension reduction' },
                  { type: 'UNSTRUCTURED', label: 'Unstructured Magnitude Pruning', desc: 'Sparse zero weights with preserved tensor shapes' },
                  { type: 'NONE', label: 'No Pruning', desc: 'Preserves full dense CNN parameter matrices' },
                ].map((p) => (
                  <div
                    key={p.type}
                    onClick={() => setFormData({ ...formData, pruning_method: p.type })}
                    className={`p-3.5 rounded border cursor-pointer transition ${
                      formData.pruning_method === p.type
                        ? 'bg-[var(--surface-elevated)] border-[var(--accent)]'
                        : 'ws-panel text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="font-semibold text-xs text-[var(--text-primary)] font-sans">{p.label}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-1 font-sans">{p.desc}</div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[var(--border)]">
                <div className="flex justify-between text-xs font-mono text-[var(--text-secondary)] mb-1.5">
                  <span>Target Pruning Sparsity Ratio:</span>
                  <span className="font-bold text-[var(--accent)]">{(formData.pruning_ratio * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.90"
                  step="0.05"
                  value={formData.pruning_ratio}
                  onChange={(e) => setFormData({ ...formData, pruning_ratio: parseFloat(e.target.value) })}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Step 5: Optimizers */}
          {step === 5 && (
            <div className="ws-panel p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="ws-section-title">
                  Step 5: Select Optimization Algorithms ({formData.selected_algorithms.length}/{algorithms.length})
                </h3>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <button onClick={handleSelectAllAlgs} className="text-[var(--accent)] hover:underline">Select All</button>
                  <span className="text-[var(--text-muted)]">&bull;</span>
                  <button onClick={handleClearAllAlgs} className="text-[var(--text-muted)] hover:underline">Clear</button>
                  <span className="text-[var(--text-muted)]">&bull;</span>
                  <button
                    onClick={() => setIsAlgorithmModalOpen(true)}
                    className="text-[var(--success)] hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Custom</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {algorithms.map((alg) => {
                  const isChecked = formData.selected_algorithms.includes(alg.key);
                  return (
                    <div
                      key={alg.key}
                      onClick={() => toggleAlgorithm(alg.key)}
                      className={`p-2.5 rounded border cursor-pointer transition select-none flex flex-col justify-between ${
                        isChecked
                          ? 'bg-[var(--surface-elevated)] border-[var(--accent)]'
                          : 'ws-panel opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold font-mono text-xs text-[var(--text-primary)]">{alg.key}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded accent-[var(--accent)]"
                        />
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] leading-tight mt-1 font-sans">{alg.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 6: Protocol & Weights */}
          {step === 6 && (
            <div className="ws-panel p-5 space-y-4">
              <h3 className="ws-section-title">Step 6: Evaluation Protocol &amp; Multi-Objective Weights</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-[var(--text-muted)] block mb-1">Execution Engine:</label>
                  <select
                    value={formData.is_demo ? 'DEMO' : 'AUTO'}
                    onChange={(e) => {
                      const isDemo = e.target.value === 'DEMO';
                      setFormData({
                        ...formData,
                        is_demo: isDemo,
                        // @ts-ignore
                        execution_mode: isDemo ? 'DEMO' : 'AUTO',
                      });
                    }}
                    className="w-full ws-input p-2 text-xs font-mono"
                  >
                    <option value="AUTO">Auto-Select (Real if PyTorch available, otherwise Simulation)</option>
                    <option value="DEMO">Deterministic Simulation (Cloud Sandbox)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-mono text-[var(--text-muted)] block mb-1">Repetitions (Runs):</label>
                  <select
                    value={formData.number_of_runs}
                    onChange={(e) => setFormData({ ...formData, number_of_runs: parseInt(e.target.value) || 5 })}
                    className="w-full ws-input p-2 text-xs font-mono"
                  >
                    <option value="1">1 Run (Fast Preview)</option>
                    <option value="3">3 Runs (Standard)</option>
                    <option value="5">5 Runs (Statistical)</option>
                    <option value="10">10 Runs (Rigorous Research)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-mono text-[var(--text-muted)] block mb-1">Pop &bull; Iterations:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={formData.population_size}
                      onChange={(e) => setFormData({ ...formData, population_size: parseInt(e.target.value) || 20 })}
                      className="ws-input p-2 text-xs font-mono"
                    />
                    <input
                      type="number"
                      value={formData.max_iterations}
                      onChange={(e) => setFormData({ ...formData, max_iterations: parseInt(e.target.value) || 30 })}
                      className="ws-input p-2 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Weight Sliders */}
              <div className="space-y-3 pt-3 border-t border-[var(--border)]">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="font-semibold text-[var(--text-primary)]">Objective Weights Distribution:</span>
                  <span className={`font-semibold ${isWeightValid ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                    Sum: {(totalWeight * 100).toFixed(0)}% {isWeightValid ? '✓' : '(Must equal 100%)'}
                  </span>
                </div>

                {[
                  { label: 'Accuracy Weight', key: 'weight_accuracy', val: formData.weight_accuracy },
                  { label: 'Latency Weight', key: 'weight_latency', val: formData.weight_latency },
                  { label: 'Model Size Weight', key: 'weight_model_size', val: formData.weight_model_size },
                  { label: 'Energy Weight', key: 'weight_energy', val: formData.weight_energy },
                ].map((w) => (
                  <div key={w.key} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono text-[var(--text-secondary)]">
                      <span>{w.label}</span>
                      <span className="font-semibold text-[var(--text-primary)]">{(w.val * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1.0"
                      step="0.05"
                      value={w.val}
                      onChange={(e) => setFormData({ ...formData, [w.key]: parseFloat(e.target.value) })}
                      className="w-full accent-[var(--accent)] cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => (step > 1 ? setStep(step - 1) : onCancel())}
              className="flex items-center gap-1.5 px-3.5 py-1.5 ws-button-secondary text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{step > 1 ? 'Previous Step' : 'Cancel'}</span>
            </button>

            {step < 6 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1.5 px-4 py-1.5 ws-button-primary text-xs"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleValidateFairness}
                  className="flex items-center gap-1.5 px-3 py-1.5 ws-button-secondary text-xs font-mono"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--success)]" />
                  <span>Verify Fairness</span>
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isWeightValid || formData.selected_algorithms.length === 0}
                  className="flex items-center gap-1.5 px-5 py-2 ws-button-primary text-xs font-semibold disabled:opacity-50"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Start Benchmark</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Live Experiment Manifest */}
        <div className="space-y-4">
          <div className="ws-panel p-5 space-y-4 sticky top-4 font-mono text-xs">
            <h3 className="ws-section-title border-b border-[var(--border)] pb-2 font-sans">
              Experiment Manifest
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Dataset:</span>
                <span className="font-semibold text-[var(--text-primary)]">{formData.dataset_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Resolution:</span>
                <span className="text-[var(--text-secondary)]">{formData.input_resolution}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">CNN Model:</span>
                <span className="font-semibold text-[var(--accent)]">{formData.cnn_model_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Quantization:</span>
                <span className="text-[var(--text-primary)]">{formData.quantization_type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Pruning:</span>
                <span className="text-[var(--success)] font-medium">{(formData.pruning_ratio * 100).toFixed(0)}% L1</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Optimizers:</span>
                <span className="font-semibold text-[var(--accent)]">
                  {formData.selected_algorithms.length} / {algorithms.length}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Runs &bull; Budget:</span>
                <span className="text-[var(--text-secondary)]">
                  {formData.number_of_runs} runs &bull; {formData.population_size} pop &bull; {formData.max_iterations} iters
                </span>
              </div>
            </div>

            {fairnessStatus && (
              <div className="mt-3 p-3 rounded bg-[var(--success)]/10 border border-[var(--success)]/30 space-y-1">
                <div className="flex items-center gap-1.5 text-[var(--success)] font-semibold font-sans">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Fairness Protocol Verified</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] font-sans">{fairnessStatus.message}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Registration Modals */}
      <DatasetUploadModal
        isOpen={isDatasetModalOpen}
        onClose={() => setIsDatasetModalOpen(false)}
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

      <ModelRegisterModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        onModelAdded={(newModel) => {
          setModels((prev) => [...prev, newModel]);
          setFormData((prev) => ({
            ...prev,
            cnn_model_name: newModel.name,
          }));
        }}
      />

      <AlgorithmUploadModal
        isOpen={isAlgorithmModalOpen}
        onClose={() => setIsAlgorithmModalOpen(false)}
        onAlgorithmAdded={(newAlgo) => {
          setAlgorithms((prev) => [...prev, newAlgo]);
          setFormData((prev) => ({
            ...prev,
            selected_algorithms: [...prev.selected_algorithms, newAlgo.key],
          }));
        }}
      />
    </div>
  );
};
