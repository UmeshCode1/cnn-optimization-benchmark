import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layers,
  Zap,
  Cpu,
  HardDrive,
  Download,
  Calculator,
  Search,
  ChevronDown,
  ChevronUp,
  Code,
  Sliders,
} from 'lucide-react';
import { CnnModelLayerProfile } from '../../types';
import { api } from '../../services/api';
import { CnnLayerLineChart } from '../charts/CnnLayerLineChart';

interface CnnLayerOperationsViewProps {
  initialModelName?: string;
  onSelectModelForBenchmark?: (modelName: string) => void;
}

const BUILTIN_MODELS = [
  'ResNet-18',
  'MobileNetV2',
  'ShuffleNetV2',
  'SimpleCNN',
  'VGG-16',
  'EfficientNet-B0',
];

const RESOLUTION_PRESETS = [
  { label: '32 × 32 (CIFAR)', value: '3,32,32' },
  { label: '64 × 64 (Tiny)', value: '3,64,64' },
  { label: '128 × 128 (Medium)', value: '3,128,128' },
  { label: '224 × 224 (ImageNet)', value: '3,224,224' },
];

export const CnnLayerOperationsView: React.FC<CnnLayerOperationsViewProps> = ({
  initialModelName = 'ResNet-18',
  onSelectModelForBenchmark,
}) => {
  const [selectedModel, setSelectedModel] = useState<string>(initialModelName);
  const [resolution, setResolution] = useState<string>('3,32,32');
  const [batchSize, setBatchSize] = useState<number>(1);
  const [pruningRatio, setPruningRatio] = useState<number>(0.0);
  const [quantizationType, setQuantizationType] = useState<string>('FP32');

  const [profile, setProfile] = useState<CnnModelLayerProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Table filtering and search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOpFilter, setSelectedOpFilter] = useState<string>('ALL');
  const [expandedLayerIdx, setExpandedLayerIdx] = useState<number | null>(null);
  const [selectedLayerForChart, setSelectedLayerForChart] = useState<number | undefined>(undefined);

  // Custom Layer Calculator Sandbox State
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);
  const [calcOpType, setCalcOpType] = useState<string>('Conv2d');
  const [calcCin, setCalcCin] = useState<number>(64);
  const [calcCout, setCalcCout] = useState<number>(128);
  const [calcHin, setCalcHin] = useState<number>(32);
  const [calcWin, setCalcWin] = useState<number>(32);
  const [calcKernel, setCalcKernel] = useState<number>(3);
  const [calcStride, setCalcStride] = useState<number>(1);
  const [calcPadding, setCalcPadding] = useState<number>(1);
  const [calcGroups, setCalcGroups] = useState<number>(1);
  const [calcBias, setCalcBias] = useState<boolean>(false);
  const [calcPruning, setCalcPruning] = useState<number>(0.0);
  const [calcResult, setCalcResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Load Model Layer Decomposition
  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getCnnLayerProfile(selectedModel, {
        resolution,
        batch_size: batchSize,
        pruning_ratio: pruningRatio,
        quantization_type: quantizationType,
      });
      setProfile(data);
      if (data.layers.length > 0 && expandedLayerIdx === null) {
        setExpandedLayerIdx(1); // auto-expand first layer
      }
    } catch (err: any) {
      console.error('Failed to load layer profile:', err);
      setError(err?.message || 'Could not load CNN layer decomposition');
    } finally {
      setIsLoading(false);
    }
  }, [selectedModel, resolution, batchSize, pruningRatio, quantizationType, expandedLayerIdx]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Execute Sandbox Custom Layer Calculation
  const runCustomCalculation = useCallback(async () => {
    try {
      setIsCalculating(true);
      const res = await api.calculateCustomLayer({
        op_type: calcOpType,
        c_in: calcCin,
        c_out: calcCout,
        h_in: calcHin,
        w_in: calcWin,
        kernel_size: calcKernel,
        stride: calcStride,
        padding: calcPadding,
        groups: calcGroups,
        has_bias: calcBias,
        batch_size: batchSize,
        precision_bits: quantizationType === 'FP16' ? 16 : quantizationType.includes('INT8') ? 8 : 32,
        pruning_ratio: calcPruning,
      });
      setCalcResult(res);
    } catch (err) {
      console.error('Custom layer calculation failed:', err);
    } finally {
      setIsCalculating(false);
    }
  }, [
    calcOpType,
    calcCin,
    calcCout,
    calcHin,
    calcWin,
    calcKernel,
    calcStride,
    calcPadding,
    calcGroups,
    calcBias,
    batchSize,
    quantizationType,
    calcPruning,
  ]);

  useEffect(() => {
    if (isCalculatorOpen) {
      runCustomCalculation();
    }
  }, [isCalculatorOpen, runCustomCalculation]);

  // Filtered Layer List
  const filteredLayers = useMemo(() => {
    if (!profile) return [];
    let list = profile.layers;

    if (selectedOpFilter !== 'ALL') {
      list = list.filter((l) => l.op_type.toUpperCase().includes(selectedOpFilter.toUpperCase()));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.stage.toLowerCase().includes(q) ||
          l.op_type.toLowerCase().includes(q)
      );
    }

    return list;
  }, [profile, selectedOpFilter, searchQuery]);

  // Export CSV
  const handleExportCSV = () => {
    if (!profile) return;
    let csv = `# CNN Layer-by-Layer Operation Breakdown\n`;
    csv += `# Model: ${profile.model_name}\n`;
    csv += `# Input: ${profile.input_resolution.join('x')} | Batch: ${profile.batch_size} | Quant: ${profile.quantization_type} | Pruning: ${(profile.pruning_ratio * 100).toFixed(0)}%\n`;
    csv += `# Total Params: ${profile.total_parameters_m} M | Total FLOPs: ${profile.total_flops_m} M\n\n`;
    csv += `Layer_Idx,Name,Stage,Op_Type,Cin,Hin,Win,Kernel,Stride,Pad,Cout,Hout,Wout,Params,FLOPs,Activation_Mem_KB,Weight_Mem_KB,Receptive_Field,Cumulative_FLOPs_M,Cumulative_Params_M,Compute_Pct,Param_Formula,FLOP_Formula\n`;

    profile.layers.forEach((l) => {
      const k = l.kernel_size ? l.kernel_size[0] : 0;
      const s = l.stride ? l.stride[0] : 0;
      const p = l.padding ? l.padding[0] : 0;
      csv += `${l.layer_index},"${l.name}","${l.stage}","${l.op_type}",${l.input_shape[0]},${l.input_shape[1]},${l.input_shape[2]},${k},${s},${p},${l.output_shape[0]},${l.output_shape[1]},${l.output_shape[2]},${l.total_params},${l.flops},${l.activation_memory_kb},${l.weight_memory_kb},${l.receptive_field},${l.cumulative_flops_m},${l.cumulative_params_m},${l.flops_pct},"${l.param_formula.replace(/"/g, '""')}","${l.flops_formula.replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cnn_layers_${profile.model_name.toLowerCase()}_${profile.input_resolution.join('x')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export JSON
  const handleExportJSON = () => {
    if (!profile) return;
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cnn_layers_${profile.model_name.toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Top Header & Context Description */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center border border-[var(--accent)]/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)] font-mono tracking-tight flex items-center gap-2">
                CNN Layer Operations &amp; Mathematical Profiler
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Examine, calculate, and profile every operation across the CNN architecture with exact arithmetic equations, tensor shapes, and memory footprints.
              </p>
            </div>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsCalculatorOpen(!isCalculatorOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              isCalculatorOpen
                ? 'bg-[var(--accent)] text-white shadow-md'
                : 'ws-button-secondary'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>{isCalculatorOpen ? 'Close Sandbox Calculator' : 'Open Custom Layer Sandbox'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={!profile}
            className="flex items-center gap-1.5 px-3 py-1.5 ws-button-secondary text-xs font-mono cursor-pointer"
            title="Download full layer table in CSV"
          >
            <Download className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            disabled={!profile}
            className="flex items-center gap-1.5 px-3 py-1.5 ws-button-secondary text-xs font-mono cursor-pointer"
            title="Export full layer architecture schema"
          >
            <Code className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Model & Hyperparameters Configuration Control Bar */}
      <div className="ws-panel p-4 space-y-3 bg-[var(--surface-secondary)]/50 border border-[var(--border)] rounded-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[var(--text-secondary)]">
          <span className="font-semibold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[var(--accent)]" />
            Architecture &amp; Execution Hyperparameters
          </span>
          <span className="text-[11px] text-[var(--text-muted)]">
            Changes reactively recompute all layer dimensions, tensor formulas, and line graphs
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-1">
          {/* 1. Model Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
              CNN Model Architecture
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full ws-input px-2.5 py-1.5 text-xs font-mono cursor-pointer"
            >
              {BUILTIN_MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Resolution Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
              Input Tensor Resolution
            </label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full ws-input px-2.5 py-1.5 text-xs font-mono cursor-pointer"
            >
              {RESOLUTION_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Batch Size */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
              Inference Batch Size (N)
            </label>
            <div className="flex items-center gap-1">
              {[1, 8, 32, 64].map((b) => (
                <button
                  key={b}
                  onClick={() => setBatchSize(b)}
                  className={`flex-1 py-1.5 text-xs font-mono rounded border transition-colors cursor-pointer ${
                    batchSize === b
                      ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)] font-bold'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface)]'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Precision Bitwidth */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
              Quantization Precision
            </label>
            <select
              value={quantizationType}
              onChange={(e) => setQuantizationType(e.target.value)}
              className="w-full ws-input px-2.5 py-1.5 text-xs font-mono cursor-pointer"
            >
              <option value="FP32">FP32 (32-bit float)</option>
              <option value="FP16">FP16 (16-bit half)</option>
              <option value="INT8">INT8 (8-bit integer)</option>
              <option value="INT4">INT4 (4-bit sub-byte)</option>
            </select>
          </div>

          {/* 5. Pruning Sparsity Slider */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] font-mono text-[var(--text-muted)]">
              <span className="uppercase tracking-wider">Pruning Sparsity</span>
              <span className="text-[var(--accent)] font-bold">{(pruningRatio * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.85"
              step="0.05"
              value={pruningRatio}
              onChange={(e) => setPruningRatio(parseFloat(e.target.value))}
              className="w-full cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* KPI Analytical Cards Strip */}
      {profile && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 font-mono">
          <div className="ws-panel p-3.5 space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[var(--accent)]" />
              Total Operations
            </span>
            <div className="text-xl font-bold text-[var(--text-primary)]">
              {profile.total_layers}
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">Sequential nodes</div>
          </div>

          <div className="ws-panel p-3.5 space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              Total Parameters
            </span>
            <div className="text-xl font-bold text-blue-400">
              {profile.total_parameters_m.toFixed(3)} M
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">
              {profile.total_parameters.toLocaleString()} weights
            </div>
          </div>

          <div className="ws-panel p-3.5 space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Compute Budget
            </span>
            <div className="text-xl font-bold text-amber-400">
              {profile.total_flops_m.toFixed(1)} M
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">FLOPs per forward pass</div>
          </div>

          <div className="ws-panel p-3.5 space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              Weight Memory
            </span>
            <div className="text-xl font-bold text-emerald-400">
              {profile.total_weight_memory_mb.toFixed(2)} MB
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">
              {profile.precision_bits}-bit precision
            </div>
          </div>

          <div className="ws-panel p-3.5 space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-purple-400" />
              Peak Activation
            </span>
            <div className="text-xl font-bold text-purple-400">
              {profile.peak_activation_memory_mb.toFixed(2)} MB
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">Batch size = {profile.batch_size}</div>
          </div>

          <div className="ws-panel p-3.5 space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-pink-400" />
              Total Activation Buffer
            </span>
            <div className="text-xl font-bold text-pink-400">
              {profile.total_activation_buffer_mb.toFixed(2)} MB
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">Cumulative tensor mem</div>
          </div>
        </div>
      )}

      {/* Interactive Custom Layer Sandbox Calculator (Collapsible) */}
      {isCalculatorOpen && (
        <div className="ws-panel p-5 space-y-4 bg-gradient-to-br from-[var(--surface-elevated)] to-[var(--surface)] border-2 border-[var(--accent)]/40 rounded-xl shadow-lg animate-fade-in">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[var(--accent)]" />
              <h3 className="font-bold text-sm text-[var(--text-primary)] font-mono">
                Interactive Custom Layer Sandbox Calculator
              </h3>
            </div>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              Test any arbitrary convolution, linear, or pooling layer &amp; inspect mathematical derivations
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs font-mono">
            <div>
              <label className="text-[10px] text-[var(--text-muted)] uppercase">Layer Type</label>
              <select
                value={calcOpType}
                onChange={(e) => setCalcOpType(e.target.value)}
                className="w-full ws-input px-2 py-1 mt-1 text-xs"
              >
                <option value="Conv2d">Conv2d (Standard)</option>
                <option value="DepthwiseConv2d">DepthwiseConv2d</option>
                <option value="BatchNorm2d">BatchNorm2d</option>
                <option value="MaxPool2d">MaxPool2d</option>
                <option value="Linear">Linear / Dense</option>
                <option value="ReLU">ReLU Activation</option>
                <option value="ResidualAdd">Residual Add</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-[var(--text-muted)] uppercase">Input Channels (Cin)</label>
              <input
                type="number"
                min="1"
                max="4096"
                value={calcCin}
                onChange={(e) => setCalcCin(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full ws-input px-2 py-1 mt-1 text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] text-[var(--text-muted)] uppercase">Output Channels (Cout)</label>
              <input
                type="number"
                min="1"
                max="4096"
                value={calcCout}
                onChange={(e) => setCalcCout(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full ws-input px-2 py-1 mt-1 text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] text-[var(--text-muted)] uppercase">Input Height (Hin)</label>
              <input
                type="number"
                min="1"
                max="2048"
                value={calcHin}
                onChange={(e) => setCalcHin(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full ws-input px-2 py-1 mt-1 text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] text-[var(--text-muted)] uppercase">Input Width (Win)</label>
              <input
                type="number"
                min="1"
                max="2048"
                value={calcWin}
                onChange={(e) => setCalcWin(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full ws-input px-2 py-1 mt-1 text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] text-[var(--text-muted)] uppercase">Kernel Size (K)</label>
              <input
                type="number"
                min="1"
                max="31"
                value={calcKernel}
                onChange={(e) => setCalcKernel(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full ws-input px-2 py-1 mt-1 text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] text-[var(--text-muted)] uppercase">Stride (S)</label>
              <input
                type="number"
                min="1"
                max="16"
                value={calcStride}
                onChange={(e) => setCalcStride(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full ws-input px-2 py-1 mt-1 text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] text-[var(--text-muted)] uppercase">Padding (P)</label>
              <input
                type="number"
                min="0"
                max="16"
                value={calcPadding}
                onChange={(e) => setCalcPadding(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full ws-input px-2 py-1 mt-1 text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] text-[var(--text-muted)] uppercase">Groups (G)</label>
              <input
                type="number"
                min="1"
                max="4096"
                value={calcGroups}
                onChange={(e) => setCalcGroups(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full ws-input px-2 py-1 mt-1 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-4">
              <input
                type="checkbox"
                id="calc-bias"
                checked={calcBias}
                onChange={(e) => setCalcBias(e.target.checked)}
                className="rounded cursor-pointer"
              />
              <label htmlFor="calc-bias" className="text-xs text-[var(--text-secondary)] cursor-pointer">
                Additive Bias
              </label>
            </div>
          </div>

          {/* Sandbox Calculation Results Display */}
          {calcResult && (
            <div className="p-4 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-lg space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[var(--text-muted)] text-[10px] uppercase block">Output Tensor Shape</span>
                  <span className="font-bold text-[var(--accent)] text-sm">
                    {calcResult.output_shape.join(' × ')}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] text-[10px] uppercase block">Parameter Count</span>
                  <span className="font-bold text-blue-400 text-sm">
                    {calcResult.total_params.toLocaleString()} weights
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] text-[10px] uppercase block">FLOPs</span>
                  <span className="font-bold text-amber-400 text-sm">
                    {(calcResult.flops / 1e6).toFixed(3)} MFLOPs
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] text-[10px] uppercase block">Activation Memory</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {calcResult.activation_memory_kb >= 1024
                      ? `${(calcResult.activation_memory_kb / 1024).toFixed(2)} MB`
                      : `${calcResult.activation_memory_kb.toFixed(1)} KB`}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border)] space-y-1 text-[11px]">
                <div className="flex items-start gap-2">
                  <span className="text-[var(--text-muted)] shrink-0">Param Derivation:</span>
                  <span className="text-[var(--text-primary)] font-semibold">{calcResult.param_formula}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[var(--text-muted)] shrink-0">FLOP Derivation:</span>
                  <span className="text-[var(--text-primary)] font-semibold">{calcResult.flops_formula}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Interactive Line Graph: Cumulative FLOPs / Params / Memory */}
      {profile && (
        <CnnLayerLineChart
          layers={profile.layers}
          height={380}
          onSelectLayer={(l) => {
            setSelectedLayerForChart(l.layer_index);
            setExpandedLayerIdx(l.layer_index);
          }}
          selectedLayerIndex={selectedLayerForChart}
        />
      )}

      {/* Operations Table Header & Filters */}
      <div className="ws-panel p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-[var(--accent)]" />
              Layer-by-Layer Operation Inventory &amp; Arithmetic Breakdown
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
              Showing {filteredLayers.length} of {profile?.total_layers || 0} operations &bull; Click any row to expand step-by-step arithmetic formulas
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Op Type Filter */}
            <div className="flex items-center gap-1 text-xs font-mono">
              <span className="text-[10px] text-[var(--text-muted)] uppercase">Filter:</span>
              {['ALL', 'CONV', 'NORM', 'POOL', 'LINEAR', 'RELU'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedOpFilter(cat)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                    selectedOpFilter === cat
                      ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)] font-bold'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search layer name / stage..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ws-input pl-8 pr-3 py-1 text-xs font-mono w-52"
              />
            </div>
          </div>
        </div>

        {/* The Operational Table */}
        <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
          <table className="ws-table font-mono text-xs">
            <thead>
              <tr>
                <th className="w-12 text-center">#</th>
                <th>Layer Name</th>
                <th>Stage</th>
                <th>Operation</th>
                <th>Input Shape (C×H×W)</th>
                <th>Kernel (K,S,P)</th>
                <th>Output Shape (C×H×W)</th>
                <th className="text-right">Parameters</th>
                <th className="text-right">FLOPs (M)</th>
                <th className="text-right">Activation Mem</th>
                <th className="text-right">Compute %</th>
                <th className="text-center w-14">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLayers.map((l) => {
                const isExpanded = expandedLayerIdx === l.layer_index;
                const isChartSelected = selectedLayerForChart === l.layer_index;

                const opColor = l.op_type.includes('Conv')
                  ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
                  : l.op_type.includes('Norm')
                  ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                  : l.op_type.includes('Pool')
                  ? 'text-purple-400 bg-purple-400/10 border-purple-400/20'
                  : l.op_type.includes('Linear')
                  ? 'text-amber-400 bg-amber-400/10 border-amber-400/20'
                  : 'text-[var(--text-muted)] bg-[var(--surface-secondary)] border-[var(--border)]';

                return (
                  <React.Fragment key={l.layer_index}>
                    <tr
                      onClick={() => {
                        setExpandedLayerIdx(isExpanded ? null : l.layer_index);
                        setSelectedLayerForChart(l.layer_index);
                      }}
                      className={`cursor-pointer transition-colors ${
                        isChartSelected
                          ? 'bg-[var(--accent)]/10 font-medium'
                          : isExpanded
                          ? 'bg-[var(--surface-secondary)]'
                          : 'hover:bg-[var(--surface-secondary)]/60'
                      }`}
                    >
                      <td className="text-center font-bold text-[var(--text-muted)]">
                        {l.layer_index}
                      </td>
                      <td className="font-bold text-[var(--text-primary)]">
                        {l.name}
                      </td>
                      <td className="text-[var(--text-muted)] text-[11px]">
                        {l.stage}
                      </td>
                      <td>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${opColor}`}>
                          {l.op_type}
                        </span>
                      </td>
                      <td className="text-[var(--text-secondary)]">
                        {l.input_shape.join(' × ')}
                      </td>
                      <td className="text-[var(--text-muted)]">
                        {l.kernel_size
                          ? `${l.kernel_size[0]}×${l.kernel_size[1]} (s=${l.stride?.[0]}, p=${l.padding?.[0]})`
                          : '—'}
                      </td>
                      <td className="font-semibold text-[var(--text-primary)]">
                        {l.output_shape.join(' × ')}
                      </td>
                      <td className="text-right text-blue-400 font-bold">
                        {l.total_params.toLocaleString()}
                      </td>
                      <td className="text-right text-amber-400 font-bold">
                        {(l.flops / 1e6).toFixed(3)}
                      </td>
                      <td className="text-right text-[var(--text-secondary)]">
                        {l.activation_memory_kb >= 1024
                          ? `${(l.activation_memory_kb / 1024).toFixed(2)} MB`
                          : `${l.activation_memory_kb.toFixed(1)} KB`}
                      </td>
                      <td className="text-right font-bold text-[var(--accent)]">
                        {l.flops_pct.toFixed(2)}%
                      </td>
                      <td className="text-center text-[var(--text-muted)]">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 mx-auto text-[var(--accent)]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 mx-auto" />
                        )}
                      </td>
                    </tr>

                    {/* Expandable Step-by-Step Mathematical Calculation Card */}
                    {isExpanded && (
                      <tr className="bg-[var(--surface-secondary)]/80 border-b border-[var(--border)]">
                        <td colSpan={12} className="p-4 space-y-3">
                          <div className="p-4 bg-[var(--surface)] border border-[var(--border-strong)] rounded-lg shadow-sm space-y-3 font-mono">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[var(--accent)] text-xs">
                                  LAYER #{l.layer_index}: {l.name}
                                </span>
                                <span className="text-[var(--text-muted)]">&bull;</span>
                                <span className="text-xs text-[var(--text-primary)] font-semibold">
                                  {l.op_type} Mathematical Derivation
                                </span>
                              </div>
                              <span className="text-[11px] text-[var(--text-muted)]">
                                Receptive Field: <strong>{l.receptive_field} px</strong> &bull; Cumulative FLOPs: <strong>{l.cumulative_flops_m} M</strong> ({l.cumulative_flops_pct}%)
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              {/* Parameter Derivation Box */}
                              <div className="space-y-1.5 p-3 rounded bg-[var(--surface-secondary)] border border-[var(--border)]">
                                <div className="text-[10px] uppercase font-bold text-blue-400">
                                  1. Parameter Count Formula &amp; Arithmetic
                                </div>
                                <div className="text-[11px] text-[var(--text-primary)] font-semibold leading-relaxed">
                                  {l.param_formula}
                                </div>
                                <div className="text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border)]/60">
                                  Weights: {l.weight_params.toLocaleString()} | Bias: {l.bias_params} | Memory: {l.weight_memory_kb.toFixed(2)} KB
                                </div>
                              </div>

                              {/* FLOP / Compute Derivation Box */}
                              <div className="space-y-1.5 p-3 rounded bg-[var(--surface-secondary)] border border-[var(--border)]">
                                <div className="text-[10px] uppercase font-bold text-amber-400">
                                  2. Floating-Point Operations (FLOPs &amp; MACs)
                                </div>
                                <div className="text-[11px] text-[var(--text-primary)] font-semibold leading-relaxed">
                                  {l.flops_formula}
                                </div>
                                <div className="text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border)]/60">
                                  MACs: {l.macs.toLocaleString()} | Share of total CNN compute: {l.flops_pct}%
                                </div>
                              </div>
                            </div>

                            {/* Tensor Dimensions & Spatial Transformation */}
                            <div className="p-3 rounded bg-[var(--surface-secondary)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-3 text-xs">
                              <div>
                                <span className="text-[10px] uppercase text-[var(--text-muted)] block">Spatial Transformation</span>
                                <span className="font-semibold text-[var(--text-primary)]">
                                  Input: [{l.input_shape.join(', ')}] &rarr; Kernel: [{l.kernel_size?.join(', ') || 'N/A'}] &rarr; Output: [{l.output_shape.join(', ')}]
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase text-[var(--text-muted)] block">Activation Memory Footprint</span>
                                <span className="font-semibold text-emerald-400">
                                  {l.activation_memory_kb >= 1024 ? `${(l.activation_memory_kb / 1024).toFixed(3)} MB` : `${l.activation_memory_kb.toFixed(2)} KB`}
                                  {' '}(Batch = {profile?.batch_size || 1})
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
