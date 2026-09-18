import React, { useState, useEffect, useMemo } from 'react';
import {
  DeviceHardwareProfile,
  DeviceSimulationResult,
  Experiment,
} from '../../types';
import { api } from '../../services/api';
import { ThermalLineChart } from '../charts/ThermalLineChart';
import {
  Watch,
  Cpu,
  Zap,
  Flame,
  BatteryCharging,
  ShieldAlert,
  ShieldCheck,
  Download,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  Activity,
  ArrowRight,
  Sliders,
  Smartphone,
  Server,
} from 'lucide-react';

interface DeviceSimulationViewProps {
  experiment?: Experiment | null;
  onNavigateToWizard?: () => void;
  onNavigateToLayers?: () => void;
}

// Quick presets representing common Edge & Wearable deep learning workloads
const PRESETS = [
  {
    name: 'Smartwatch Activity Recognition (HAR)',
    flops_m: 14.2,
    parameters_m: 0.12,
    model_size_mb: 0.48,
    accuracy: 94.2,
    quantization_type: 'INT8',
    description: 'Ultra-lightweight 1D/2D CNN for continuous wrist accelerometer gesture classification.',
  },
  {
    name: 'Wearable Arrhythmia ECG Detection',
    flops_m: 38.5,
    parameters_m: 0.35,
    model_size_mb: 1.4,
    accuracy: 96.8,
    quantization_type: 'INT8',
    description: 'Compact 6-layer CNN processing real-time single-lead ECG signals on wristbands.',
  },
  {
    name: 'MobileNetV2 (Uncompressed FP32)',
    flops_m: 300.0,
    parameters_m: 3.4,
    model_size_mb: 13.6,
    accuracy: 92.4,
    quantization_type: 'FP32',
    description: 'Standard vision classifier baseline without quantization or pruning.',
  },
  {
    name: 'MobileNetV2 (SCA Optimized INT8)',
    flops_m: 85.0,
    parameters_m: 1.1,
    model_size_mb: 1.1,
    accuracy: 91.8,
    quantization_type: 'INT8',
    description: 'Structured pruned + INT8 quantized via Sine Cosine Algorithm for wearable deployment.',
  },
  {
    name: 'ResNet-18 (Heavy Edge Baseline)',
    flops_m: 1800.0,
    parameters_m: 11.2,
    model_size_mb: 44.8,
    accuracy: 95.1,
    quantization_type: 'FP32',
    description: 'Heavy standard CNN highlighting severe thermal throttling on micro-wearables.',
  },
];

export const DeviceSimulationView: React.FC<DeviceSimulationViewProps> = ({
  experiment,
  onNavigateToWizard,
  onNavigateToLayers,
}) => {
  const [devices, setDevices] = useState<DeviceHardwareProfile[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('mini-watch-smartwatch');
  const [isLoadingDevices, setIsLoadingDevices] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<DeviceSimulationResult | null>(null);
  const [multiDeviceResults, setMultiDeviceResults] = useState<Record<string, DeviceSimulationResult>>({});
  const [isSimulatingAll, setIsSimulatingAll] = useState<boolean>(false);

  // Model parameters state
  const [modelName, setModelName] = useState<string>(experiment?.cnn_model_name || 'Wearable-CNN-Int8');
  const [flopsM, setFlopsM] = useState<number>(38.5);
  const [paramsM, setParamsM] = useState<number>(0.35);
  const [modelSizeMb, setModelSizeMb] = useState<number>(1.4);
  const [accuracy, setAccuracy] = useState<number>(95.4);
  const [quantization, setQuantization] = useState<string>('INT8');
  const [ambientTempC, setAmbientTempC] = useState<number>(25.0);

  // UI state
  const [copiedLatex, setCopiedLatex] = useState<boolean>(false);
  const [copiedMd, setCopiedMd] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'single' | 'matrix' | 'physics'>('single');

  // Load available device profiles
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setIsLoadingDevices(true);
        const data = await api.getDeviceProfiles();
        setDevices(data);
        if (data.length > 0 && !data.some((d) => d.id === selectedDeviceId)) {
          setSelectedDeviceId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load device profiles:', err);
      } finally {
        setIsLoadingDevices(false);
      }
    };
    fetchDevices();
  }, []);

  // Synchronize with active experiment if provided
  useEffect(() => {
    if (experiment) {
      setModelName(experiment.cnn_model_name || 'Custom-Model');
      // If the experiment has best metrics, adapt them
      if (experiment.baseline_accuracy) {
        setAccuracy(Number((experiment.baseline_accuracy * 100).toFixed(1)));
      }
    }
  }, [experiment]);

  // Execute single device simulation
  const runSimulation = async () => {
    if (!selectedDeviceId) return;
    try {
      setIsSimulating(true);
      const res = await api.simulateDeviceDeployment({
        device_id: selectedDeviceId,
        model_name: modelName,
        flops_m: flopsM,
        parameters_m: paramsM,
        model_size_mb: modelSizeMb,
        accuracy: accuracy,
        quantization_type: quantization,
        ambient_temp_c: ambientTempC,
      });
      setSimulationResult(res);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Run initial simulation once devices are loaded
  useEffect(() => {
    if (devices.length > 0) {
      runSimulation();
    }
  }, [selectedDeviceId, devices]);

  // Simulate across all hardware targets for comparison matrix
  const runMultiDeviceComparison = async () => {
    if (devices.length === 0) return;
    try {
      setIsSimulatingAll(true);
      const results: Record<string, DeviceSimulationResult> = {};
      for (const dev of devices) {
        const res = await api.simulateDeviceDeployment({
          device_id: dev.id,
          model_name: modelName,
          flops_m: flopsM,
          parameters_m: paramsM,
          model_size_mb: modelSizeMb,
          accuracy: accuracy,
          quantization_type: quantization,
          ambient_temp_c: ambientTempC,
        });
        results[dev.id] = res;
      }
      setMultiDeviceResults(results);
    } catch (err) {
      console.error('Multi-device simulation error:', err);
    } finally {
      setIsSimulatingAll(false);
    }
  };

  // Auto-run multi-device comparison when switching to matrix tab
  useEffect(() => {
    if (activeTab === 'matrix' && Object.keys(multiDeviceResults).length === 0 && devices.length > 0) {
      runMultiDeviceComparison();
    }
  }, [activeTab, devices]);

  // Preset selector handler
  const handleApplyPreset = (preset: (typeof PRESETS)[0]) => {
    setModelName(preset.name);
    setFlopsM(preset.flops_m);
    setParamsM(preset.parameters_m);
    setModelSizeMb(preset.model_size_mb);
    setAccuracy(preset.accuracy);
    setQuantization(preset.quantization_type);
  };

  // Calculate size automatically when params & quantization change
  const handleParamsChange = (newParamsM: number) => {
    setParamsM(newParamsM);
    let bytesPerParam = 4;
    if (quantization === 'FP16') bytesPerParam = 2;
    if (quantization === 'INT8') bytesPerParam = 1;
    if (quantization === 'INT4') bytesPerParam = 0.5;
    const estMb = Number(((newParamsM * 1000000 * bytesPerParam) / (1024 * 1024)).toFixed(2));
    setModelSizeMb(Math.max(0.01, estMb));
  };

  const handleQuantizationChange = (newQuant: string) => {
    setQuantization(newQuant);
    let bytesPerParam = 4;
    if (newQuant === 'FP16') bytesPerParam = 2;
    if (newQuant === 'INT8') bytesPerParam = 1;
    if (newQuant === 'INT4') bytesPerParam = 0.5;
    const estMb = Number(((paramsM * 1000000 * bytesPerParam) / (1024 * 1024)).toFixed(2));
    setModelSizeMb(Math.max(0.01, estMb));
  };

  const selectedDevice = useMemo(() => {
    return devices.find((d) => d.id === selectedDeviceId) || devices[0];
  }, [devices, selectedDeviceId]);

  // Generate LaTeX table snippet for research papers
  const generateLatexSnippet = () => {
    if (!simulationResult) return '';
    const resList = Object.keys(multiDeviceResults).length > 0
      ? Object.values(multiDeviceResults)
      : [simulationResult];

    let tex = `% =========================================================================\n`;
    tex += `% Hardware Deployment Benchmark & Thermal Dissipation on Edge/Wearables\n`;
    tex += `% Generated by CNN Metaheuristic Benchmark & Edge Physics Engine\n`;
    tex += `% Model: ${modelName} | Precision: ${quantization} | FLOPs: ${flopsM} M | Params: ${paramsM} M\n`;
    tex += `% =========================================================================\n`;
    tex += `\\begin{table}[htbp]\n`;
    tex += `  \\centering\n`;
    tex += `  \\caption{Empirical Hardware Deployment Simulation: Latency, Power, Thermal Rise, and Battery Lifetime}\n`;
    tex += `  \\label{tab:edge_wearable_deployment}\n`;
    tex += `  \\resizebox{\\columnwidth}{!}{\n`;
    tex += `  \\begin{tabular}{lccccccr}\n`;
    tex += `    \\toprule\n`;
    tex += `    \\textbf{Target Device} & \\textbf{Latency (ms)} & \\textbf{FPS} & \\textbf{Power (mW)} & \\textbf{Energy (mJ)} & \\textbf{$\\Delta T$ ($^\\circ$C)} & \\textbf{Skin Temp} & \\textbf{Battery Life} \\\\\n`;
    tex += `    \\midrule\n`;

    resList.forEach((r) => {
      const devName = r.device.name.replace(/_/g, ' ');
      const lat = r.performance.latency_ms.toFixed(1);
      const fps = r.performance.fps.toFixed(1);
      const pwr = r.power_and_energy.total_power_mw.toFixed(1);
      const en = r.power_and_energy.energy_mj.toFixed(2);
      const deltaT = r.thermal.delta_temp_c.toFixed(1);
      const skinTemp = `${r.thermal.operating_temp_c.toFixed(1)}$^\\circ$C`;
      const bat = r.battery.continuous_runtime_hours > 0
        ? `${r.battery.continuous_runtime_hours.toFixed(1)} h`
        : 'Mains AC';
      tex += `    ${devName} & ${lat} & ${fps} & ${pwr} & ${en} & +${deltaT} & ${skinTemp} & ${bat} \\\\\n`;
    });

    tex += `    \\bottomrule\n`;
    tex += `  \\end{tabular}\n`;
    tex += `  }\n`;
    tex += `\\end{table}\n`;
    return tex;
  };

  // Generate Markdown table snippet
  const generateMarkdownSnippet = () => {
    if (!simulationResult) return '';
    const resList = Object.keys(multiDeviceResults).length > 0
      ? Object.values(multiDeviceResults)
      : [simulationResult];

    let md = `### Hardware Deployment & Thermal Dissipation Benchmark\n\n`;
    md += `**Model**: ${modelName} | **Precision**: ${quantization} | **Compute**: ${flopsM} MFLOPs | **Parameters**: ${paramsM} M | **Accuracy**: ${accuracy}%\n\n`;
    md += `| Target Device | Latency (ms) | Throughput (FPS) | Total Power (mW) | Energy (mJ) | Temp Rise $\\Delta T$ | Surface Temp | Skin Limit (43°C) | Battery Runtime |\n`;
    md += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;
    resList.forEach((r) => {
      const devName = r.device.name;
      const lat = r.performance.latency_ms.toFixed(1);
      const fps = r.performance.fps.toFixed(1);
      const pwr = r.power_and_energy.total_power_mw.toFixed(1);
      const en = r.power_and_energy.energy_mj.toFixed(2);
      const deltaT = `+${r.thermal.delta_temp_c.toFixed(1)}°C`;
      const skinTemp = `${r.thermal.operating_temp_c.toFixed(1)}°C`;
      const status = r.thermal.thermal_status === 'OVERHEATING_WARNING' ? '⚠️ EXCEEDED' : '✅ SAFE';
      const bat = r.battery.continuous_runtime_hours > 0
        ? `${r.battery.continuous_runtime_hours.toFixed(1)} hrs`
        : 'Continuous';
      md += `| ${devName} | ${lat} | ${fps} | ${pwr} | ${en} | ${deltaT} | ${skinTemp} | ${status} | ${bat} |\n`;
    });
    return md;
  };

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(generateLatexSnippet());
    setCopiedLatex(true);
    setTimeout(() => setCopiedLatex(false), 2000);
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdownSnippet());
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Watch className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
                <span>Edge &amp; Wearable Hardware Simulator</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Physics &bull; Thermal &bull; Battery
                </span>
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Simulate deployment of compressed CNNs on mini smartwatches, low-power MCUs, IoT nodes, and NPUs.
                Computes latency, power draw (mW), heat production ($\Delta T$), skin safety limit (IEC 62368-1), and battery discharge.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex p-1 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-xs font-mono">
            <button
              onClick={() => setActiveTab('single')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                activeTab === 'single'
                  ? 'bg-[var(--accent)] text-white font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Single Device
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-[var(--accent)] text-white font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Hardware Matrix
            </button>
            <button
              onClick={() => setActiveTab('physics')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                activeTab === 'physics'
                  ? 'bg-[var(--accent)] text-white font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Formulas &amp; Standards
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyLatex}
              title="Copy LaTeX table for research paper"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--surface-secondary)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              {copiedLatex ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>LaTeX</span>
            </button>
            <button
              onClick={handleCopyMarkdown}
              title="Copy Markdown table"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--surface-secondary)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
              <span>Markdown</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preset Workloads Strip */}
      <div className="ws-panel p-3.5 space-y-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Quick Workload Presets for Research
          </span>
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            Click any preset to auto-populate model FLOPs, size, and precision
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => handleApplyPreset(p)}
              className="p-2.5 rounded-lg bg-[var(--surface-secondary)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] hover:border-[var(--accent)] text-left transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] line-clamp-1">
                  {p.name}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] font-mono mt-1">
                  {p.flops_m} MFLOPs &bull; {p.parameters_m}M &bull; {p.quantization_type}
                </div>
              </div>
              <div className="text-[10px] font-mono text-emerald-400 font-semibold mt-2">
                Acc: {p.accuracy}%
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Top Controls: Hardware Selector + Model Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Device Selection (5 cols) */}
        <div className="lg:col-span-5 ws-panel p-4 space-y-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
            <h3 className="text-xs font-bold font-mono text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>Target Hardware Profile</span>
            </h3>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              {devices.length} Architectures
            </span>
          </div>

          {isLoadingDevices ? (
            <div className="p-8 text-center text-xs font-mono text-[var(--text-muted)]">
              Loading hardware specifications...
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-1 gap-2">
                {devices.map((dev) => {
                  const isSelected = dev.id === selectedDeviceId;
                  return (
                    <div
                      key={dev.id}
                      onClick={() => setSelectedDeviceId(dev.id)}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-500/10 border-blue-500/50 shadow-xs'
                          : 'bg-[var(--surface-secondary)] border-[var(--border)] hover:border-[var(--text-muted)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-1.5 rounded ${
                              isSelected ? 'bg-blue-500/20 text-blue-300' : 'bg-[var(--surface-elevated)] text-[var(--text-muted)]'
                            }`}
                          >
                            {dev.category === 'wearable' ? (
                              <Watch className="w-4 h-4" />
                            ) : dev.category === 'mobile' ? (
                              <Smartphone className="w-4 h-4" />
                            ) : dev.category === 'workstation' ? (
                              <Server className="w-4 h-4" />
                            ) : (
                              <Cpu className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[var(--text-primary)]">
                              {dev.name}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono">
                              {dev.processor} &bull; {dev.memory_type}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                            dev.category === 'wearable'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {dev.category}
                        </span>
                      </div>

                      {/* Hardware Key Specs Grid */}
                      <div className="grid grid-cols-4 gap-1.5 mt-2.5 pt-2 border-t border-[var(--border)] text-[10px] font-mono">
                        <div>
                          <div className="text-[var(--text-muted)] text-[9px]">Compute</div>
                          <div className="font-semibold text-[var(--text-primary)]">{dev.compute_gflops} GFLOPS</div>
                        </div>
                        <div>
                          <div className="text-[var(--text-muted)] text-[9px]">TDP</div>
                          <div className="font-semibold text-amber-400">{dev.tdp_watts} W</div>
                        </div>
                        <div>
                          <div className="text-[var(--text-muted)] text-[9px]">Therm R_th</div>
                          <div className="font-semibold text-rose-400">{dev.thermal_resistance_c_per_w}°C/W</div>
                        </div>
                        <div>
                          <div className="text-[var(--text-muted)] text-[9px]">Battery</div>
                          <div className="font-semibold text-emerald-400">
                            {dev.battery_capacity_mah > 0 ? `${dev.battery_capacity_mah} mAh` : 'Mains'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Model Compression & Parameter Inputs (7 cols) */}
        <div className="lg:col-span-7 ws-panel p-4 space-y-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
            <h3 className="text-xs font-bold font-mono text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Model &amp; Compression Configuration</span>
            </h3>
            {experiment && (
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Active Benchmark: {experiment.id}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            {/* Model Name */}
            <div>
              <label className="block text-[var(--text-secondary)] text-[11px] mb-1">
                Model Identifier
              </label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--accent)]"
              />
            </div>

            {/* Quantization Type */}
            <div>
              <label className="block text-[var(--text-secondary)] text-[11px] mb-1">
                Weight &amp; Activation Precision
              </label>
              <select
                value={quantization}
                onChange={(e) => handleQuantizationChange(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--accent)]"
              >
                <option value="FP32">FP32 &bull; 32-bit Float (Standard)</option>
                <option value="FP16">FP16 &bull; 16-bit Half-Precision</option>
                <option value="INT8">INT8 &bull; 8-bit Integer (Recommended for Wearables)</option>
                <option value="INT4">INT4 &bull; 4-bit Ultra-Compressed</option>
              </select>
            </div>

            {/* FLOPs (MFLOPs) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[var(--text-secondary)] text-[11px]">FLOPs (MFLOPs)</label>
                <span className="text-emerald-400 font-bold">{flopsM} M</span>
              </div>
              <input
                type="number"
                step="0.5"
                min="0.1"
                max="50000"
                value={flopsM}
                onChange={(e) => setFlopsM(parseFloat(e.target.value) || 0.1)}
                className="w-full px-3 py-2 rounded bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--accent)]"
              />
              <span className="text-[10px] text-[var(--text-muted)]">
                Wearable target: &lt; 50 MFLOPs for real-time 30 FPS
              </span>
            </div>

            {/* Parameters (M) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[var(--text-secondary)] text-[11px]">Parameters (MParams)</label>
                <span className="text-blue-400 font-bold">{paramsM} M</span>
              </div>
              <input
                type="number"
                step="0.05"
                min="0.001"
                max="200"
                value={paramsM}
                onChange={(e) => handleParamsChange(parseFloat(e.target.value) || 0.01)}
                className="w-full px-3 py-2 rounded bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--accent)]"
              />
              <span className="text-[10px] text-[var(--text-muted)]">
                Calculates memory footprint: {modelSizeMb} MB
              </span>
            </div>

            {/* Accuracy (%) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[var(--text-secondary)] text-[11px]">Validation Accuracy (%)</label>
                <span className="text-purple-400 font-bold">{accuracy}%</span>
              </div>
              <input
                type="number"
                step="0.1"
                min="10"
                max="100"
                value={accuracy}
                onChange={(e) => setAccuracy(parseFloat(e.target.value) || 50)}
                className="w-full px-3 py-2 rounded bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--accent)]"
              />
            </div>

            {/* Ambient Temperature */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[var(--text-secondary)] text-[11px]">Ambient Temp T_amb (°C)</label>
                <span className="text-amber-400 font-bold">{ambientTempC}°C</span>
              </div>
              <input
                type="number"
                step="0.5"
                min="0"
                max="50"
                value={ambientTempC}
                onChange={(e) => setAmbientTempC(parseFloat(e.target.value) || 25)}
                className="w-full px-3 py-2 rounded bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--accent)]"
              />
              <span className="text-[10px] text-[var(--text-muted)]">
                Standard room temp = 25°C, skin contact base = 32°C
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
            <div className="text-[11px] text-[var(--text-muted)] font-mono">
              Model Size: <span className="text-[var(--text-primary)] font-bold">{modelSizeMb} MB</span> &bull; 
              Arithmetic Intensity: <span className="text-[var(--text-primary)] font-bold">{(flopsM / (modelSizeMb || 1)).toFixed(1)} FLOPs/Byte</span>
            </div>
            <button
              onClick={runSimulation}
              disabled={isSimulating}
              className="px-4 py-2 ws-button-primary text-xs font-mono flex items-center gap-1.5 cursor-pointer"
            >
              {isSimulating ? (
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Activity className="w-3.5 h-3.5" />
              )}
              <span>Recalculate Physics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Analysis Display based on Active Tab */}
      {activeTab === 'single' && simulationResult && (
        <div className="space-y-6">
          {/* Key Metric KPI Cards (4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Latency & Throughput */}
            <div className="ws-panel p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-mono">
                <span className="uppercase tracking-wider">Inference Latency</span>
                <Cpu className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                  {simulationResult.performance.latency_ms.toFixed(1)}
                  <span className="text-xs text-[var(--text-muted)] ml-1 font-normal">ms</span>
                </div>
                <div className="text-xs font-mono text-emerald-400 font-semibold">
                  {simulationResult.performance.fps.toFixed(1)} FPS
                </div>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] font-mono border-t border-[var(--border)] pt-1.5 flex justify-between">
                <span>Speedup vs FP32:</span>
                <span className="font-semibold text-emerald-400">
                  {simulationResult.performance.speedup_vs_fp32}x
                </span>
              </div>
            </div>

            {/* KPI 2: Power Draw */}
            <div className="ws-panel p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-mono">
                <span className="uppercase tracking-wider">Total Power Draw</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold font-mono text-amber-400">
                  {simulationResult.power_and_energy.total_power_mw.toFixed(1)}
                  <span className="text-xs text-[var(--text-muted)] ml-1 font-normal">mW</span>
                </div>
                <div className="text-xs font-mono text-[var(--text-muted)]">
                  ({simulationResult.power_and_energy.total_power_w.toFixed(3)} W)
                </div>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] font-mono border-t border-[var(--border)] pt-1.5 flex justify-between">
                <span>Idle Baseline:</span>
                <span>{simulationResult.power_and_energy.idle_power_mw} mW</span>
              </div>
            </div>

            {/* KPI 3: Energy per Inference */}
            <div className="ws-panel p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-mono">
                <span className="uppercase tracking-wider">Energy per Inference</span>
                <Activity className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold font-mono text-purple-400">
                  {simulationResult.power_and_energy.energy_mj.toFixed(2)}
                  <span className="text-xs text-[var(--text-muted)] ml-1 font-normal">mJ</span>
                </div>
                <div className="text-xs font-mono text-[var(--text-muted)]">
                  ({simulationResult.power_and_energy.energy_uj.toFixed(0)} μJ)
                </div>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] font-mono border-t border-[var(--border)] pt-1.5 flex justify-between">
                <span>Accuracy Retained:</span>
                <span className="font-semibold text-purple-300">{accuracy}%</span>
              </div>
            </div>

            {/* KPI 4: Heat Rise & Skin Contact Safety */}
            <div
              className={`ws-panel p-4 rounded-xl space-y-2 border ${
                simulationResult.thermal.thermal_status === 'OVERHEATING_WARNING'
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                  : simulationResult.thermal.thermal_status === 'WARM'
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="uppercase tracking-wider font-semibold">Surface Temp / Skin Safety</span>
                {simulationResult.thermal.thermal_status === 'OVERHEATING_WARNING' ? (
                  <Flame className="w-4 h-4 text-rose-400 animate-bounce" />
                ) : simulationResult.thermal.thermal_status === 'WARM' ? (
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold font-mono">
                  {simulationResult.thermal.operating_temp_c.toFixed(1)}°C
                </div>
                <div className="text-xs font-mono font-semibold">
                  (+{simulationResult.thermal.delta_temp_c.toFixed(1)}°C rise)
                </div>
              </div>
              <div className="text-[10px] font-mono border-t border-current/20 pt-1.5 line-clamp-1">
                Limit: {simulationResult.thermal.skin_contact_limit_c}°C &bull; {simulationResult.thermal.thermal_status}
              </div>
            </div>
          </div>

          {/* Safety Alert Banner if Skin Limit Exceeded */}
          {simulationResult.thermal.thermal_status === 'OVERHEATING_WARNING' && (
            <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-start gap-3">
              <Flame className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <div className="font-bold text-rose-300 uppercase tracking-wider font-mono">
                  IEC 62368-1 / ISO 13732-1 Wearable Safety Warning: Skin Burn Risk
                </div>
                <p className="text-rose-200/90 leading-relaxed font-sans">
                  The steady-state surface temperature reaches{' '}
                  <strong className="font-mono text-white">{simulationResult.thermal.operating_temp_c.toFixed(1)}°C</strong>,
                  which violates the international wearable continuous skin-contact threshold of{' '}
                  <strong className="font-mono text-white">{simulationResult.thermal.skin_contact_limit_c}°C</strong>.
                  Without model compression (e.g., pruning or INT8 quantization via SCA) or duty cycling, this neural network cannot be safely worn on human skin.
                </p>
              </div>
            </div>
          )}

          {/* Battery Lifetime Section (for Wearable & Mobile targets) */}
          {simulationResult.battery.battery_capacity_mah > 0 && (
            <div className="ws-panel p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
                <div className="flex items-center gap-2">
                  <BatteryCharging className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold font-mono text-[var(--text-primary)] uppercase tracking-wider">
                    Battery Autonomy &amp; Deployment Lifetime
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  Cell: {simulationResult.battery.battery_capacity_mah} mAh &bull; {simulationResult.battery.battery_energy_wh.toFixed(2)} Wh
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-3 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)]">
                  <div className="text-[var(--text-muted)] text-[11px] mb-1">Continuous Active Runtime</div>
                  <div className="text-xl font-bold text-emerald-400">
                    {simulationResult.battery.continuous_runtime_hours.toFixed(1)}{' '}
                    <span className="text-xs text-[var(--text-muted)]">Hours</span>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-1">
                    Continuous 100% inference duty cycle
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)]">
                  <div className="text-[var(--text-muted)] text-[11px] mb-1">Total Inferences on Charge</div>
                  <div className="text-xl font-bold text-blue-400">
                    {(simulationResult.battery.total_inferences_on_charge / 1000).toFixed(0)}k{' '}
                    <span className="text-xs text-[var(--text-muted)]">Inferences</span>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-1">
                    At {simulationResult.power_and_energy.energy_mj.toFixed(2)} mJ per forward pass
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)]">
                  <div className="text-[var(--text-muted)] text-[11px] mb-1">Duty-Cycled Battery Life (1 Hz)</div>
                  <div className="text-xl font-bold text-purple-400">
                    {(simulationResult.battery.continuous_runtime_hours * 18).toFixed(1)}{' '}
                    <span className="text-xs text-[var(--text-muted)]">Hours</span>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-1">
                    1 inference/sec with sleep power states
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Thermal Heating & Saturation Line Chart */}
          <ThermalLineChart
            thermalCurve={simulationResult.thermal.thermal_curve}
            skinContactLimitC={simulationResult.thermal.skin_contact_limit_c}
            ambientTempC={simulationResult.thermal.ambient_temp_c}
            operatingTempC={simulationResult.thermal.operating_temp_c}
            deviceName={simulationResult.device.name}
            height={340}
          />
        </div>
      )}

      {/* Multi-Device Benchmark Matrix View */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold font-mono text-[var(--text-primary)] uppercase tracking-wider">
                Cross-Hardware Comparative Deployment Matrix
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Direct evaluation of <span className="font-mono font-bold text-[var(--accent)]">{modelName}</span> ({quantization}, {flopsM} MFLOPs) across all edge, wearable, and desktop platforms.
              </p>
            </div>

            <button
              onClick={runMultiDeviceComparison}
              disabled={isSimulatingAll}
              className="px-3 py-1.5 ws-button-primary text-xs font-mono flex items-center gap-1.5 cursor-pointer"
            >
              {isSimulatingAll ? (
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Activity className="w-3.5 h-3.5" />
              )}
              <span>Refresh Matrix</span>
            </button>
          </div>

          <div className="ws-panel overflow-x-auto bg-[var(--surface)] border border-[var(--border)] rounded-xl">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--text-muted)] uppercase text-[10px] tracking-wider">
                  <th className="p-3">Target Device</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Latency</th>
                  <th className="p-3 text-right">FPS</th>
                  <th className="p-3 text-right">Power Draw</th>
                  <th className="p-3 text-right">Energy / Inf</th>
                  <th className="p-3 text-right">Heat Rise (ΔT)</th>
                  <th className="p-3 text-right">Steady Temp</th>
                  <th className="p-3 text-center">IEC 62368-1</th>
                  <th className="p-3 text-right">Battery Life</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {devices.map((dev) => {
                  const r = multiDeviceResults[dev.id];
                  if (!r) {
                    return (
                      <tr key={dev.id} className="hover:bg-[var(--surface-secondary)]/50">
                        <td className="p-3 font-semibold text-[var(--text-primary)]">{dev.name}</td>
                        <td className="p-3 text-[var(--text-muted)]">{dev.category}</td>
                        <td colSpan={8} className="p-3 text-center text-[var(--text-muted)]">
                          Computing simulation...
                        </td>
                      </tr>
                    );
                  }
                  const isExceeded = r.thermal.thermal_status === 'OVERHEATING_WARNING';
                  const isWarm = r.thermal.thermal_status === 'WARM';

                  return (
                    <tr
                      key={dev.id}
                      className={`hover:bg-[var(--surface-secondary)]/50 transition-colors ${
                        dev.id === selectedDeviceId ? 'bg-blue-500/5 font-medium' : ''
                      }`}
                    >
                      <td className="p-3 font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        {dev.category === 'wearable' ? (
                          <Watch className="w-3.5 h-3.5 text-amber-400" />
                        ) : dev.category === 'mobile' ? (
                          <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                        ) : dev.category === 'workstation' ? (
                          <Server className="w-3.5 h-3.5 text-purple-400" />
                        ) : (
                          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span>{dev.name}</span>
                      </td>
                      <td className="p-3 text-[var(--text-muted)] uppercase text-[10px]">{dev.category}</td>
                      <td className="p-3 text-right font-bold text-[var(--text-primary)]">
                        {r.performance.latency_ms.toFixed(1)} ms
                      </td>
                      <td className="p-3 text-right text-emerald-400 font-semibold">
                        {r.performance.fps.toFixed(1)}
                      </td>
                      <td className="p-3 text-right text-amber-400">
                        {r.power_and_energy.total_power_mw.toFixed(1)} mW
                      </td>
                      <td className="p-3 text-right text-purple-300">
                        {r.power_and_energy.energy_mj.toFixed(2)} mJ
                      </td>
                      <td className="p-3 text-right text-rose-400 font-semibold">
                        +{r.thermal.delta_temp_c.toFixed(1)}°C
                      </td>
                      <td className="p-3 text-right font-bold">
                        <span
                          className={
                            isExceeded
                              ? 'text-rose-400'
                              : isWarm
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }
                        >
                          {r.thermal.operating_temp_c.toFixed(1)}°C
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            isExceeded
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : isWarm
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {isExceeded ? 'FAIL (>43°C)' : isWarm ? 'WARM' : 'PASS'}
                        </span>
                      </td>
                      <td className="p-3 text-right text-[var(--text-secondary)]">
                        {r.battery.continuous_runtime_hours > 0
                          ? `${r.battery.continuous_runtime_hours.toFixed(1)} h`
                          : 'Mains AC'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Physics Formulas & Regulatory Standards Tab */}
      {activeTab === 'physics' && (
        <div className="space-y-4">
          <div className="ws-panel p-5 bg-[var(--surface)] border border-[var(--border)] rounded-xl space-y-4">
            <h3 className="text-sm font-bold font-mono text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400" />
              <span>Mathematical Formulations &amp; Thermal Modeling Methodology</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] space-y-2">
                <div className="font-bold text-amber-400">1. Roofline Latency Modeling</div>
                <p className="text-[var(--text-secondary)] font-sans text-[11px] leading-relaxed">
                  Execution time is determined by whichever hardware resource acts as the bottleneck (arithmetic compute capacity vs memory bus bandwidth):
                </p>
                <div className="p-2.5 rounded bg-black/40 text-blue-300 font-mono text-[11px]">
                  T_latency = max(FLOPs / Peak_GFLOPs, Bytes / Bandwidth_GBps)
                </div>
                <p className="text-[10px] text-[var(--text-muted)] font-sans">
                  Quantization (e.g. INT8) accelerates compute by utilizing SIMD hardware dot-product instructions while slashing memory transfer traffic by 4x.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] space-y-2">
                <div className="font-bold text-amber-400">2. CMOS Dynamic Power Dissipation</div>
                <p className="text-[var(--text-secondary)] font-sans text-[11px] leading-relaxed">
                  Active electrical power draw is dominated by CMOS capacitive switching and clock distribution:
                </p>
                <div className="p-2.5 rounded bg-black/40 text-amber-300 font-mono text-[11px]">
                  P_total = P_idle + α · C_eff · V_dd² · f
                </div>
                <p className="text-[10px] text-[var(--text-muted)] font-sans">
                  Where α is the switching activity factor, C_eff is capacitance, and V_dd is the supply voltage.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] space-y-2">
                <div className="font-bold text-rose-400">3. Steady-State Heat Production (ΔT)</div>
                <p className="text-[var(--text-secondary)] font-sans text-[11px] leading-relaxed">
                  Enclosures without fans or active cooling dissipate heat passively via thermal resistance R_th:
                </p>
                <div className="p-2.5 rounded bg-black/40 text-rose-300 font-mono text-[11px]">
                  ΔT = P_total · R_th ; T_surface = T_ambient + ΔT
                </div>
                <p className="text-[10px] text-[var(--text-muted)] font-sans">
                  Mini smartwatches have extremely high thermal resistance (~35°C/W), making heat dissipation a critical limiter.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] space-y-2">
                <div className="font-bold text-rose-400">4. IEC 62368-1 &amp; ISO 13732-1 Safety Limit</div>
                <p className="text-[var(--text-secondary)] font-sans text-[11px] leading-relaxed">
                  International safety standards for wearable devices mandate strict thermal contact limits:
                </p>
                <div className="p-2.5 rounded bg-black/40 text-purple-300 font-mono text-[11px]">
                  T_surface ≤ 43.0°C (Continuous skin contact limit)
                </div>
                <p className="text-[10px] text-[var(--text-muted)] font-sans">
                  Surpassing 43°C creates risk of epidermal burns and thermal discomfort, requiring model pruning or duty cycling.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
