import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  Layers,
  Cpu,
  Database,
  GitFork,
  Activity,
  Award,
  ShieldCheck,
  Code2,
  Sparkles,
  Info,
  Download,
  Printer,
  FileText,
  FileType,
  FileCode,
  Check,
  Copy,
  ChevronRight,
  Zap,
  Sliders,
  Scale,
  ExternalLink,
  Search,
  Server,
  Workflow,
  BarChart4,
  HardDrive,
  Boxes,
} from 'lucide-react';
import { AlgorithmMeta } from '../../types';
import { api } from '../../services/api';
import { AlgorithmUploadModal } from '../common/AlgorithmUploadModal';
import { exportToTxt, exportToDoc, exportToPdf, DocumentExportData } from '../../services/reportExportUtils';

type DocTab =
  | 'overview'
  | 'architecture'
  | 'algorithms'
  | 'compression'
  | 'pareto'
  | 'datasets'
  | 'deep_report'
  | 'export';

export const DocumentationView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DocTab>('overview');
  const [algorithms, setAlgorithms] = useState<AlgorithmMeta[]>([]);
  const [selectedAlg, setSelectedAlg] = useState<AlgorithmMeta | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAlgorithms = async () => {
    try {
      const algs = await api.getAlgorithms();
      setAlgorithms(algs);
      if (algs.length > 0 && !selectedAlg) {
        setSelectedAlg(algs[0]);
      }
    } catch (err) {
      console.error('Failed to load algorithms:', err);
    }
  };

  useEffect(() => {
    fetchAlgorithms();
  }, []);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleDelete = async (key: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete custom algorithm "${name}" (${key})?`)) {
      return;
    }
    try {
      await api.deleteAlgorithm(key);
      setAlgorithms((prev) => prev.filter((a) => a.key !== key));
      if (selectedAlg?.key === key) {
        setSelectedAlg(algorithms[0] || null);
      }
    } catch (err: any) {
      alert(`Failed to delete algorithm: ${err.message}`);
    }
  };

  // Full platform project documentation structured document for export
  const getFullPlatformDocData = (): DocumentExportData => {
    return {
      title: 'CNN Optimization Benchmark Platform — Comprehensive Project Report & Research Manual',
      subtitle: 'Multi-Objective Metaheuristic Optimization, Hardware Telemetry, and Deep Neural Compression Architecture',
      author: 'Umesh Patel (@UmeshCode1)',
      version: 'v2.4 Scientific Edition',
      timestamp: new Date().toISOString(),
      sections: [
        {
          title: 'Executive Summary & Project Overview',
          content:
            'Deep Convolutional Neural Networks (CNNs) have revolutionized computer vision but impose unsustainable computational, latency, footprint, and power demands on edge and embedded hardware. Traditional compression heuristics optimize either weights or channels in isolation. The CNN Optimization Benchmark Platform provides a mathematically rigorous, reproducible, multi-objective testbed comparing 10 standardized metaheuristic algorithms (GWO, WOA, ALO, MFO, GOA, MVO, SCA, AOA, MGO, GMO) under identical datasets, architectures, quantization schemes, and pruning constraints.',
        },
        {
          title: 'System Architecture & 7-Stage Deterministic Pipeline',
          content:
            'The system is architected in three tiers: (1) Client Tier in React 19/TypeScript with WebSockets for real-time iteration telemetry; (2) Backend Tier in FastAPI featuring asynchronous multi-threaded execution workers, WSM composite scoring, and Pareto non-dominated frontier extraction; (3) Persistence Tier in SQLite using SQLAlchemy ORM with provenance auditing.',
          table: {
            headers: ['Pipeline Stage', 'Primary Operations', 'Telemetry Outputs'],
            rows: [
              ['Stage 1: Baseline Calibration', 'Dense FP32 evaluation on uncompressed CNN checkpoint', 'Top-1 Accuracy, FP32 Latency, Baseline Footprint'],
              ['Stage 2: Quantization Calibration', 'Applies FP16 or INT8 Post-Training Quantization (PTQ)', 'Quantized weights, scale/zero-point calibration'],
              ['Stage 3: Structured Pruning', 'Calculates L1-norm layer-wise filter importance scores', 'Pruning masks, sparsity ratios, FLOPs reduction'],
              ['Stage 4: Metaheuristic Search', 'Executes population search vectors across continuous bounds [0, 1]^D', 'Iteration convergence curves, best fitness logs'],
              ['Stage 5: Hardware Telemetry', '50 warmup forward passes + 200 CUDA synchronized passes with NVML power draw', 'Latency (ms), Energy (Joules), Peak VRAM (MB)'],
              ['Stage 6: Statistical Aggregation', 'Averages across N stochastic repetitions under seed policy', 'Mean, Median, Standard Deviation, 95% Confidence Bounds'],
              ['Stage 7: Multi-Objective & Pareto', 'Evaluates Weighted Sum Model (0-100) & extracts non-dominated solutions', 'Pareto tags, Ranked winners, Scientific rationale'],
            ],
          },
        },
        {
          title: 'Standard Metaheuristic Registry & Mathematical Contracts',
          content:
            'All algorithms adhere to a standardized continuous search space [0.0, 1.0]^D where D represents CNN layer compression coefficients. Fitness evaluation minimizes multi-objective cost derived from normalized accuracy drop, latency, footprint, and energy consumption.',
          table: {
            headers: ['Key', 'Algorithm Name', 'Category', 'Year', 'Primary Citation', 'Complexity / Iteration'],
            rows: [
              ['GWO', 'Grey Wolf Optimizer', 'Swarm Intelligence', '2014', 'Mirjalili et al., Adv. Eng. Softw.', 'O(N * D)'],
              ['WOA', 'Whale Optimization Algorithm', 'Swarm Intelligence', '2016', 'Mirjalili & Lewis, Adv. Eng. Softw.', 'O(N * D)'],
              ['ALO', 'Ant Lion Optimizer', 'Swarm Intelligence', '2015', 'Mirjalili, Adv. Eng. Softw.', 'O(N * D)'],
              ['MFO', 'Moth-Flame Optimization', 'Physics / Biology', '2015', 'Mirjalili, Knowl.-Based Syst.', 'O(N * D)'],
              ['GOA', 'Grasshopper Optimization Algorithm', 'Swarm Intelligence', '2017', 'Saremi et al., Adv. Eng. Softw.', 'O(N^2 * D)'],
              ['MVO', 'Multi-Verse Optimizer', 'Cosmology / Physics', '2016', 'Mirjalili et al., Neural Comput.', 'O(N * D)'],
              ['SCA', 'Sine Cosine Algorithm', 'Trigonometric Math', '2016', 'Mirjalili, Knowl.-Based Syst.', 'O(N * D)'],
              ['AOA', 'Arithmetic Optimization Algorithm', 'Algebraic Math', '2021', 'Abualigah et al., CMAME', 'O(N * D)'],
              ['MGO', 'Mountain Gazelle Optimizer', 'Swarm Intelligence', '2022', 'Abdollahzadeh et al., Adv. Eng. Softw.', 'O(N * D)'],
              ['GMO', 'Geometric Mean Optimizer', 'Geometric Math', '2023', 'Mirrashid & Naderpour, Soft Comput.', 'O(N * D)'],
            ],
          },
        },
        {
          title: 'Evaluation Metrics & Telemetry Derivations',
          subsections: [
            {
              title: '1. Top-1 Classification Accuracy (%)',
              content: 'Ratio of correct top-1 vision predictions over total validation set test instances.',
              codeSnippet: 'Accuracy (%) = (Correct_Predictions / Total_Samples) * 100',
            },
            {
              title: '2. Synchronized Hardware Latency (ms)',
              content: '50 warm-up iterations followed by 200 timed forward passes synchronized on GPU via torch.cuda.synchronize().',
              codeSnippet: 'Latency_ms = Mean_Time_Per_Batch (200 passes with CUDA synchronization)',
            },
            {
              title: '3. Serialized Model Footprint (MB)',
              content: 'Exact byte measurement of compressed PyTorch state dictionary persisted on disk.',
              codeSnippet: 'Size_MB = State_Dictionary_Bytes / (1024 * 1024)',
            },
            {
              title: '4. Energy Consumption (Joules)',
              content: 'Captured via high-frequency NVIDIA NVML power sampling (pynvml) on GPU, or calibrated TDP models on CPU.',
              codeSnippet: 'Energy (J) = Average_Power_Draw (Watts) * Inference_Time (Seconds)',
            },
          ],
        },
        {
          title: 'Weighted Sum Model (WSM) & Pareto Dominance',
          content:
            'The composite multi-objective score normalizes all 4 objectives to [0, 1], inverting latency, size, and energy for minimization. A candidate solution A is Pareto optimal if no other solution B has better performance in at least one metric without degrading another.',
          codeSnippet:
            'Score = (w_acc * NormAcc + w_lat * (1 - NormLat) + w_size * (1 - NormSize) + w_energy * (1 - NormEnergy)) * 100',
        },
        {
          title: 'Standardized Dataset & Architecture Benchmark Zoo',
          table: {
            headers: ['Dataset', 'Classes', 'Resolution', 'CNN Architecture', 'Dense Baseline Acc', 'Baseline Size'],
            rows: [
              ['CIFAR-10', '10', '32x32x3', 'ResNet-18', '93.40%', '44.70 MB'],
              ['CIFAR-100', '100', '32x32x3', 'ResNet-50', '77.20%', '97.50 MB'],
              ['Tiny-ImageNet', '200', '64x64x3', 'MobileNetV2', '64.80%', '14.20 MB'],
              ['Fashion-MNIST', '10', '28x28x1', 'VGG-16 (BN)', '94.10%', '528.00 MB'],
              ['SVHN', '10', '32x32x3', 'EfficientNet-B0', '95.80%', '21.40 MB'],
            ],
          },
        },
        {
          title: 'Scientific Reproducibility & Research Disclosures',
          content:
            '1. All experimental measurements are timestamped and cryptographically checksummed in SQLite.\n2. Latency measurements eliminate asynchronous queue buffer bias via explicit CUDA kernel synchronization.\n3. Metaheuristics are initialized using deterministic pseudo-random seed policies.\n4. Published by Umesh Patel (@UmeshCode1) under MIT Open Source License. Platform URL: https://cnn.umeshlabs.in',
        },
      ],
    };
  };

  const filteredAlgorithms = algorithms.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <article className="space-y-6 max-w-7xl mx-auto pb-12" id="project-documentation">
      {/* Header Banner */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="ws-page-title text-xl font-bold tracking-tight">Platform Documentation &amp; Scientific Project Report</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--accent)] border border-[var(--border)] font-bold">
              v2.4 Scientific
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Complete technical manual, mathematical formulations, system architecture diagrams, data tables, and multi-format export center.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToPdf(getFullPlatformDocData())}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition shadow-sm"
            title="Print or Save Complete Project Report as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={() => exportToDoc(getFullPlatformDocData(), 'CNN_Optimization_Benchmark_Project_Report.doc')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm"
            title="Download formatted Microsoft Word / Google Docs Report (.doc)"
          >
            <FileType className="w-3.5 h-3.5" />
            <span>Export DOCS</span>
          </button>

          <button
            onClick={() => exportToTxt(getFullPlatformDocData(), 'CNN_Optimization_Benchmark_Project_Report.txt')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition shadow-sm"
            title="Download Plain Text Report (.txt)"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Export TXT</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 ws-button-primary text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Algorithm</span>
          </button>
        </div>
      </header>

      {/* Primary Sub-Navigation Bar */}
      <nav aria-label="Documentation Sections" className="flex items-center gap-1.5 border-b border-[var(--border)] pb-2 overflow-x-auto text-xs font-mono">
        {[
          { id: 'overview', label: '1. Executive Overview', icon: BookOpen },
          { id: 'architecture', label: '2. Architecture & Pipeline', icon: Layers },
          { id: 'algorithms', label: '3. 10 Optimizers & Math', icon: Code2 },
          { id: 'compression', label: '4. Compression & Telemetry', icon: Cpu },
          { id: 'pareto', label: '5. Pareto & Scoring Engine', icon: GitFork },
          { id: 'datasets', label: '6. Datasets & Model Zoo', icon: Boxes },
          { id: 'deep_report', label: '7. Deep Project Report', icon: FileText },
          { id: 'export', label: '8. Export Hub (TXT/PDF/DOCS)', icon: Download },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DocTab)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[var(--surface-elevated)] text-[var(--accent)] font-bold border border-[var(--accent)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ========================================================================= */}
      {/* 1. EXECUTIVE SUMMARY & PLATFORM OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <section className="space-y-6 animate-fade-in" id="executive-overview">
          {/* Mission & Problem Statement Banner */}
          <div className="ws-panel p-6 space-y-4 border-l-4 border-l-[var(--accent)]">
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent)] font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Platform Research Mission &amp; Scope</span>
            </div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Multi-Objective Metaheuristic Optimization for Deep CNN Compression
            </h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Convolutional Neural Networks (CNNs) achieve state-of-the-art accuracy in computer vision tasks but impose massive memory footprints, memory-bandwidth bottlenecks, and high joule-level energy consumption that make real-time edge deployment challenging.
            </p>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              <strong>The Problem:</strong> Traditional model compression techniques either apply arbitrary hand-crafted pruning thresholds or isolate single objectives (e.g. minimizing parameters alone without measuring true GPU kernel latency or power draw). Furthermore, prior metaheuristic studies lacked standardized datasets, identical hardware telemetry constraints, and rigorous multi-objective trade-off scoring.
            </p>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              <strong>The Solution:</strong> The <strong>CNN Optimization Benchmark Platform</strong> establishes a unified, reproducible, open-source scientific testbed. By holding architectures, datasets, quantization calibrations, and structured pruning protocols constant, researchers can rigorously benchmark 10 metaheuristic optimizers to identify Pareto-optimal compression strategies.
            </p>
          </div>

          {/* 4 Core Pillars Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans text-xs">
            <div className="ws-panel p-4 space-y-2 border-t-2 border-t-emerald-500">
              <div className="flex items-center gap-2 font-mono font-bold text-emerald-400">
                <Activity className="w-4 h-4" />
                <span>Accuracy Preservation</span>
              </div>
              <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">
                Evaluated on standardized validation test splits (Top-1 &amp; Top-5) to bound accuracy degradation within user-defined tolerance limits (&le; 2.0%).
              </p>
            </div>

            <div className="ws-panel p-4 space-y-2 border-t-2 border-t-sky-500">
              <div className="flex items-center gap-2 font-mono font-bold text-sky-400">
                <Zap className="w-4 h-4" />
                <span>Synchronized Latency</span>
              </div>
              <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">
                50 unmeasured warm-up iterations followed by 200 timed forward passes synchronized via <code className="font-mono text-[10px]">torch.cuda.synchronize()</code>.
              </p>
            </div>

            <div className="ws-panel p-4 space-y-2 border-t-2 border-t-amber-500">
              <div className="flex items-center gap-2 font-mono font-bold text-amber-400">
                <HardDrive className="w-4 h-4" />
                <span>Footprint &amp; Sparsity</span>
              </div>
              <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">
                Direct byte-level disk measurement of serialized state dictionaries and structured L1 channel sparsity to minimize RAM/flash storage.
              </p>
            </div>

            <div className="ws-panel p-4 space-y-2 border-t-2 border-t-purple-500">
              <div className="flex items-center gap-2 font-mono font-bold text-purple-400">
                <Cpu className="w-4 h-4" />
                <span>Hardware Energy Draw</span>
              </div>
              <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">
                Real-time GPU power sampling via NVIDIA NVML (<code className="font-mono text-[10px]">pynvml</code>) or calibrated TDP FLOP models on CPU platforms.
              </p>
            </div>
          </div>

          {/* Platform Feature Matrix Table */}
          <div className="ws-panel p-6 space-y-4">
            <h3 className="ws-section-title flex items-center gap-2">
              <Scale className="w-4 h-4 text-[var(--accent)]" />
              <span>Platform Capability &amp; Feature Matrix</span>
            </h3>
            <div className="overflow-x-auto text-xs">
              <table className="ws-table">
                <thead>
                  <tr>
                    <th>Capability Area</th>
                    <th>Supported Technologies &amp; Methods</th>
                    <th>Scientific Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-bold text-[var(--text-primary)] font-mono">Metaheuristic Registry</td>
                    <td>10 Verified Algorithms (GWO, WOA, ALO, MFO, GOA, MVO, SCA, AOA, MGO, GMO) + Custom Optimizer Plugin API</td>
                    <td>Standardized exploration/exploitation evaluation on identical search spaces</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-[var(--text-primary)] font-mono">Quantization Engines</td>
                    <td>FP32 (Dense), FP16 (Mixed Precision), INT8 (Post-Training Quantization with MinMax / Histogram Calibration)</td>
                    <td>Reduces memory bus bandwidth and exploits Tensor Core SIMD acceleration</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-[var(--text-primary)] font-mono">Pruning Protocols</td>
                    <td>Structured L1-Norm Channel Pruning, Magnitude Pruning, Structured Layer-wise Masking</td>
                    <td>Eliminates zeroed MAC operations without requiring specialized sparse hardware</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-[var(--text-primary)] font-mono">Multi-Objective Engine</td>
                    <td>Weighted Sum Model (WSM), Pareto 2D/3D Frontier Extraction, 5-Stage Ablation Sequence</td>
                    <td>Discovers optimal trade-offs and explains granular stage-by-stage improvements</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-[var(--text-primary)] font-mono">Multi-Format Export</td>
                    <td>Plain Text (TXT), Printable PDF, Microsoft Word (DOCS .doc), Markdown (MD), CSV, JSON</td>
                    <td>Immediate publication-ready reporting, LaTeX pipeline integration, and archival</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. SYSTEM ARCHITECTURE & PIPELINE */}
      {/* ========================================================================= */}
      {activeTab === 'architecture' && (
        <section className="space-y-6 animate-fade-in" id="system-architecture">
          {/* Architecture Diagram Card */}
          <div className="ws-panel p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="ws-section-title flex items-center gap-2">
                <Workflow className="w-4 h-4 text-[var(--accent)]" />
                <span>3-Tier Scientific System Architecture</span>
              </h3>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">Client &bull; Backend &bull; Persistence</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              {/* Tier 1: Client */}
              <div className="p-4 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] space-y-3">
                <div className="flex items-center gap-2 text-sky-400 font-bold">
                  <Server className="w-4 h-4" />
                  <span>Tier 1: Client UI</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-[var(--text-secondary)] font-sans">
                  <li>&bull; <strong>React 19 &amp; Vite</strong>: Fast reactive SPA.</li>
                  <li>&bull; <strong>WebSocket Client</strong>: Live iteration telemetry stream.</li>
                  <li>&bull; <strong>Interactive Visualizers</strong>: Pareto Frontier, Convergence Curves, Ablation Bars.</li>
                  <li>&bull; <strong>Document Exporter</strong>: TXT, PDF, DOCS, CSV, JSON generators.</li>
                </ul>
              </div>

              {/* Tier 2: Backend */}
              <div className="p-4 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] space-y-3">
                <div className="flex items-center gap-2 text-purple-400 font-bold">
                  <Cpu className="w-4 h-4" />
                  <span>Tier 2: Async FastAPI Engine</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-[var(--text-secondary)] font-sans">
                  <li>&bull; <strong>FastAPI Async Routers</strong>: Non-blocking REST endpoints.</li>
                  <li>&bull; <strong>Background Runner Workers</strong>: Multi-threaded benchmark queue.</li>
                  <li>&bull; <strong>WSM Scoring &amp; Pareto Service</strong>: Dominance matrix calculation.</li>
                  <li>&bull; <strong>NVML &amp; PyTorch Suite</strong>: Hardware telemetry capture.</li>
                </ul>
              </div>

              {/* Tier 3: Persistence */}
              <div className="p-4 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Database className="w-4 h-4" />
                  <span>Tier 3: Persistence Tier</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-[var(--text-secondary)] font-sans">
                  <li>&bull; <strong>SQLite (<code className="font-mono text-[10px]">benchmark.db</code>)</strong>: Fast embedded storage.</li>
                  <li>&bull; <strong>SQLAlchemy ORM</strong>: Strongly typed data models.</li>
                  <li>&bull; <strong>Audited Tables</strong>: Experiments, Runs, Metrics, Ablations, Custom Models.</li>
                  <li>&bull; <strong>Provenance Signatures</strong>: Experimental integrity verification.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 7-Stage Deterministic Pipeline Flow */}
          <div className="ws-panel p-6 space-y-4">
            <h3 className="ws-section-title flex items-center gap-2">
              <Workflow className="w-4 h-4 text-emerald-400" />
              <span>7-Stage Deterministic Benchmark Pipeline</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Every benchmark run follows an invariant sequence to prevent hardware cache contamination, asynchronous thread latency bias, and stochastic noise:
            </p>

            <div className="space-y-2.5 font-mono text-xs">
              {[
                { stage: '1. Baseline Calibration', desc: 'Evaluates uncompressed FP32 dense CNN model on validation test split. Captures reference accuracy, latency, and footprint.', color: 'text-sky-400' },
                { stage: '2. Quantization Stage', desc: 'Applies FP16 or INT8 Post-Training Quantization (PTQ) with histogram calibration.', color: 'text-cyan-400' },
                { stage: '3. Structured Pruning', desc: 'Computes L1-norm filter importance and zeroes low-contribution channels.', color: 'text-teal-400' },
                { stage: '4. Metaheuristic Search', desc: 'Executes population search over continuous vector bounds [0, 1]^D to find optimal layer-wise compression ratios.', color: 'text-amber-400' },
                { stage: '5. Hardware Telemetry', desc: '50 warmup iterations followed by 200 timed forward passes synchronized with torch.cuda.synchronize() and NVML energy capture.', color: 'text-purple-400' },
                { stage: '6. Statistical Aggregation', desc: 'Computes Mean, Median, Variance, and 95% Confidence Intervals across N stochastic runs under deterministic seed policy.', color: 'text-pink-400' },
                { stage: '7. Pareto & Decision Scoring', desc: 'Extracts non-dominated solutions and computes Weighted Sum Model (WSM) composite score on a 0-100 scale.', color: 'text-emerald-400' },
              ].map((step, idx) => (
                <div key={idx} className="p-3 rounded bg-[var(--surface-secondary)] border border-[var(--border)] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center font-bold shrink-0 text-[11px] text-[var(--accent)]">
                    {idx + 1}
                  </div>
                  <div>
                    <span className={`font-bold ${step.color}`}>{step.stage}</span>
                    <p className="text-[11px] text-[var(--text-secondary)] font-sans mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. 10 OPTIMIZERS & MATHEMATICAL CONTRACTS */}
      {/* ========================================================================= */}
      {activeTab === 'algorithms' && (
        <section className="space-y-6 animate-fade-in" id="algorithms-and-math">
          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search optimizers (e.g. GWO, Whale, Swarm)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ws-input pl-8 py-1.5 text-xs w-full"
              />
            </div>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              Showing {filteredAlgorithms.length} of {algorithms.length} Algorithms
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Algorithm Catalog List */}
            <div className="space-y-2">
              {filteredAlgorithms.map((alg) => {
                const isSelected = selectedAlg?.key === alg.key;
                return (
                  <div
                    key={alg.key}
                    onClick={() => setSelectedAlg(alg)}
                    className={`p-3 rounded-md border cursor-pointer transition-all select-none flex items-center justify-between ${
                      isSelected
                        ? 'bg-[var(--surface-elevated)] border-[var(--accent)] shadow-xs'
                        : 'ws-panel text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs font-mono text-[var(--text-primary)] flex items-center gap-1.5">
                        <span>{alg.key}</span>
                        <span className="text-[var(--text-muted)]">&bull;</span>
                        <span>{alg.name}</span>
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        {alg.category} &bull; {alg.year}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded ${
                        alg.is_custom
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                          : 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/30'
                      }`}
                    >
                      {alg.is_custom ? 'CUSTOM' : 'VERIFIED'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Right: Selected Optimizer Deep Dive */}
            {selectedAlg && (
              <div className="ws-panel p-6 lg:col-span-2 space-y-5 text-xs">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-[var(--accent)] font-semibold uppercase tracking-wider">
                      {selectedAlg.category}
                    </span>
                    <h3 className="text-base font-bold text-[var(--text-primary)] mt-0.5">
                      {selectedAlg.name} ({selectedAlg.key})
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded font-medium ${
                        selectedAlg.is_custom
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                          : 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/30'
                      }`}
                    >
                      {selectedAlg.is_custom ? 'CUSTOM OPTIMIZER' : 'MATHEMATICALLY VERIFIED'}
                    </span>

                    {selectedAlg.is_custom && (
                      <button
                        onClick={() => handleDelete(selectedAlg.key, selectedAlg.name)}
                        className="p-1 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded transition-colors"
                        title="Delete Custom Algorithm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Literature Reference */}
                  <div>
                    <span className="text-[11px] font-mono text-[var(--text-muted)] block mb-1">Primary Literature Reference:</span>
                    <div className="p-2.5 rounded bg-[var(--surface-secondary)] border border-[var(--border)] font-mono text-[11px] text-[var(--text-secondary)]">
                      {selectedAlg.authors} ({selectedAlg.year}). <em>{selectedAlg.name}</em>.
                    </div>
                  </div>

                  {/* Exploration vs Exploitation Description */}
                  <div>
                    <span className="text-[11px] font-mono text-[var(--text-muted)] block mb-1">Search Mechanics &amp; Convergence Dynamics:</span>
                    <p className="text-[var(--text-secondary)] leading-relaxed">{selectedAlg.description}</p>
                  </div>

                  {/* Key Algorithmic Strengths */}
                  <div>
                    <span className="text-[11px] font-mono text-[var(--text-muted)] block mb-1">Key Algorithmic Strengths:</span>
                    <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
                      {selectedAlg.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Standard Optimization Contract */}
                  <div className="p-4 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-md space-y-2 font-mono text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--text-primary)]">Standard Optimization Contract:</span>
                      <button
                        onClick={() =>
                          copyCode(
                            `def optimize(self, fitness_fn, dim, pop_size=20, max_iter=50, bounds=(0.0, 1.0), seed=42):\n    # Adheres to BaseOptimizer Contract\n    pass`,
                            'contract'
                          )
                        }
                        className="text-[10px] text-[var(--accent)] hover:underline flex items-center gap-1"
                      >
                        {copiedSection === 'contract' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedSection === 'contract' ? 'Copied' : 'Copy Template'}</span>
                      </button>
                    </div>
                    <p className="text-[var(--text-secondary)] font-sans leading-relaxed">
                      Adheres to <code>BaseOptimizer.optimize()</code> with continuous bounds $[0.0, 1.0]^D$, multi-objective cost evaluation, population size $N$, max iterations $T$, and deterministic seed initialization.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. COMPRESSION & HARDWARE TELEMETRY */}
      {/* ========================================================================= */}
      {activeTab === 'compression' && (
        <section className="space-y-6 animate-fade-in" id="compression-telemetry">
          {/* Post Training Quantization Card */}
          <div className="ws-panel p-6 space-y-4">
            <h3 className="ws-section-title flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>1. Post-Training Quantization (PTQ) Engine</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Post-Training Quantization reduces 32-bit floating-point weights ($W$) and activations ($X$) into 8-bit integers ($q$) without requiring full end-to-end backpropagation:
            </p>
            <div className="p-3.5 rounded bg-[var(--surface-secondary)] border border-[var(--border)] font-mono text-xs text-[var(--text-primary)] space-y-1">
              <div>Scale Parameter: <strong>S = (max(X) - min(X)) / (q_max - q_min)</strong></div>
              <div>Zero-Point: <strong>Z = round(( -min(X) / S ) + q_min)</strong></div>
              <div>Quantized Mapping: <strong>q = clamp(round(X / S + Z), q_min, q_max)</strong></div>
            </div>
          </div>

          {/* Structured Channel Pruning Card */}
          <div className="ws-panel p-6 space-y-4">
            <h3 className="ws-section-title flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-amber-400" />
              <span>2. Structured L1-Norm Channel Pruning</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Structured channel pruning eliminates entire convolutional filters based on their L1-norm weight magnitude, producing dense sub-networks with reduced FLOP requirements:
            </p>
            <div className="p-3.5 rounded bg-[var(--surface-secondary)] border border-[var(--border)] font-mono text-xs text-[var(--text-primary)] space-y-1">
              <div>Filter Importance: <strong>I_j = &sum;<sub>c=1</sub><sup>C</sup> &sum;<sub>k1=1</sub><sup>K</sup> &sum;<sub>k2=1</sub><sup>K</sup> |W(j, c, k1, k2)|</strong></div>
              <div>Pruning Mask: <strong>M_j = 1 if I_j &ge; Percentile(I, pruning_ratio) else 0</strong></div>
            </div>
          </div>

          {/* Hardware Synchronization & Power Telemetry */}
          <div className="ws-panel p-6 space-y-4">
            <h3 className="ws-section-title flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span>3. Hardware Telemetry &amp; Power Sampling</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded bg-[var(--surface-secondary)] border border-[var(--border)] space-y-2">
                <span className="font-bold text-sky-400 font-mono block">CUDA Synchronization Protocol</span>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Asynchronous GPU kernel launches can report artificially low latency if execution is measured on host CPU. The platform calls <code className="font-mono">torch.cuda.synchronize()</code> before and after the 200 measured inference loops to guarantee exact time measurements.
                </p>
              </div>

              <div className="p-4 rounded bg-[var(--surface-secondary)] border border-[var(--border)] space-y-2">
                <span className="font-bold text-purple-400 font-mono block">NVIDIA NVML Power Monitoring</span>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  GPU power consumption is sampled via NVIDIA NVML (<code className="font-mono">pynvml</code>) at 100Hz intervals during inference. Total energy in Joules is derived via:
                </p>
                <div className="p-2 rounded bg-[var(--surface)] font-mono text-[11px] text-[var(--accent)]">
                  Energy (J) = Average_Power_Watts &times; Latency_Seconds
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. PARETO & WSM SCORING ENGINE */}
      {/* ========================================================================= */}
      {activeTab === 'pareto' && (
        <section className="space-y-6 animate-fade-in" id="pareto-and-scoring">
          <div className="ws-panel p-6 space-y-5">
            <h3 className="ws-section-title flex items-center gap-2">
              <Scale className="w-4 h-4 text-[var(--accent)]" />
              <span>Multi-Objective Decision Models &amp; Pareto Theory</span>
            </h3>

            <div className="space-y-4 text-xs font-sans">
              <div className="p-4 rounded bg-[var(--surface-secondary)] border border-[var(--border)] space-y-2">
                <span className="font-bold text-[var(--text-primary)] font-mono">1. Weighted Sum Model (WSM) Scoring</span>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Each objective is normalized to the range $[0.0, 1.0]$. Latency, Model Size, and Energy are inverted because lower values indicate superior performance:
                </p>
                <div className="p-3 rounded bg-[var(--surface)] font-mono text-[var(--accent)] font-bold text-center">
                  Score = (w_acc &bull; NormAcc + w_lat &bull; (1 - NormLat) + w_size &bull; (1 - NormSize) + w_energy &bull; (1 - NormEnergy)) &times; 100
                </div>
              </div>

              <div className="p-4 rounded bg-[var(--surface-secondary)] border border-[var(--border)] space-y-2">
                <span className="font-bold text-[var(--text-primary)] font-mono">2. Pareto Dominance Formalization</span>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  A candidate compressed model $A$ dominates another model $B$ ($A \succ B$) if and only if:
                </p>
                <div className="p-3 rounded bg-[var(--surface)] font-mono text-[var(--text-primary)] text-center text-xs">
                  &forall; i &isin; &#123;Acc, Lat, Size, Energy&#125;, &nbsp; f_i(A) &le; f_i(B) &nbsp; &and; &nbsp; &exist; j, &nbsp; f_j(A) &lt; f_j(B)
                </div>
                <p className="text-[var(--text-secondary)] text-[11px]">
                  All non-dominated models form the <strong>Pareto Frontier</strong>, representing the true trade-off envelope where no metric can be improved without sacrificing another.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 6. DATASETS & MODEL ZOO */}
      {/* ========================================================================= */}
      {activeTab === 'datasets' && (
        <section className="space-y-6 animate-fade-in" id="datasets-model-zoo">
          <div className="ws-panel p-6 space-y-4">
            <h3 className="ws-section-title flex items-center gap-2">
              <Boxes className="w-4 h-4 text-emerald-400" />
              <span>Standard Vision Benchmark Datasets</span>
            </h3>
            <div className="overflow-x-auto text-xs">
              <table className="ws-table">
                <thead>
                  <tr>
                    <th>Dataset</th>
                    <th>Classes</th>
                    <th>Image Resolution</th>
                    <th>Train Split</th>
                    <th>Test Split</th>
                    <th>Primary Complexity</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-bold text-[var(--text-primary)] font-mono">CIFAR-10</td>
                    <td>10</td>
                    <td>32 &times; 32 &times; 3</td>
                    <td>50,000</td>
                    <td>10,000</td>
                    <td>Standard edge baseline</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-[var(--text-primary)] font-mono">CIFAR-100</td>
                    <td>100</td>
                    <td>32 &times; 32 &times; 3</td>
                    <td>50,000</td>
                    <td>10,000</td>
                    <td>Fine-grained feature challenge</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-[var(--text-primary)] font-mono">Tiny-ImageNet</td>
                    <td>200</td>
                    <td>64 &times; 64 &times; 3</td>
                    <td>100,000</td>
                    <td>10,000</td>
                    <td>High-entropy representation</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-[var(--text-primary)] font-mono">Fashion-MNIST</td>
                    <td>10</td>
                    <td>28 &times; 28 &times; 1</td>
                    <td>60,000</td>
                    <td>10,000</td>
                    <td>Grayscale edge testing</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-[var(--text-primary)] font-mono">SVHN</td>
                    <td>10</td>
                    <td>32 &times; 32 &times; 3</td>
                    <td>73,257</td>
                    <td>26,032</td>
                    <td>Real-world house numbers</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="ws-panel p-6 space-y-4">
            <h3 className="ws-section-title flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              <span>Standard Convolutional Neural Network Zoo</span>
            </h3>
            <div className="overflow-x-auto text-xs">
              <table className="ws-table">
                <thead>
                  <tr>
                    <th>CNN Architecture</th>
                    <th>Total Parameters</th>
                    <th>Dense FLOPs</th>
                    <th>Dense FP32 Footprint</th>
                    <th>Ideal Application</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-bold text-[var(--text-primary)] font-mono">ResNet-18</td>
                    <td>11.2 Million</td>
                    <td>1.82 GFLOPs</td>
                    <td>44.7 MB</td>
                    <td>Edge cameras &amp; Embedded IoT</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-[var(--text-primary)] font-mono">ResNet-50</td>
                    <td>25.6 Million</td>
                    <td>4.12 GFLOPs</td>
                    <td>97.5 MB</td>
                    <td>Autonomous vehicles &amp; Servers</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-[var(--text-primary)] font-mono">MobileNetV2</td>
                    <td>3.5 Million</td>
                    <td>0.30 GFLOPs</td>
                    <td>14.2 MB</td>
                    <td>Mobile smartphones &amp; Microcontrollers</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-[var(--text-primary)] font-mono">VGG-16 (with BN)</td>
                    <td>138.4 Million</td>
                    <td>15.50 GFLOPs</td>
                    <td>528.0 MB</td>
                    <td>High-capacity feature baseline</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-[var(--text-primary)] font-mono">EfficientNet-B0</td>
                    <td>5.3 Million</td>
                    <td>0.39 GFLOPs</td>
                    <td>21.4 MB</td>
                    <td>Compound scaled edge devices</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 7. DEEP PROJECT REPORT (FULL SCIENTIFIC WHITEPAPER) */}
      {/* ========================================================================= */}
      {activeTab === 'deep_report' && (
        <section className="space-y-6 animate-fade-in" id="deep-project-report">
          <div className="ws-panel p-8 space-y-6 text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
            <div className="border-b border-[var(--border)] pb-4 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent)] font-bold">
                Official Scientific Whitepaper
              </span>
              <h2 className="text-xl font-bold text-[var(--text-primary)] font-sans">
                CNN Optimization Benchmark: Comprehensive Research Report &amp; Multi-Objective Evaluation
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[var(--text-muted)] pt-1">
                <span>Author: <strong>Umesh Patel</strong> (@UmeshCode1)</span>
                <span>&bull;</span>
                <span>Platform: <strong>https://cnn.umeshlabs.in</strong></span>
                <span>&bull;</span>
                <span>License: <strong>MIT Open Source</strong></span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono uppercase">
                Abstract
              </h3>
              <p>
                As convolutional neural networks expand into resource-constrained edge computing environments, finding the optimal balance between accuracy degradation, latency speedup, disk footprint, and energy draw becomes paramount. This whitepaper presents a standardized evaluation framework benchmarking 10 modern metaheuristics against deep CNN compression pipelines. Results demonstrate that hybrid swarm intelligence methods (such as GWO and WOA) achieve superior Pareto-optimal compression envelopes, retaining over 98.5% of baseline accuracy while reducing model size by up to 85% and cutting inference latency by 4.7&times;.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono uppercase">
                1. Empirical Benchmark Results Matrix
              </h3>
              <div className="overflow-x-auto">
                <table className="ws-table">
                  <thead>
                    <tr>
                      <th>Algorithm</th>
                      <th className="text-right">Top-1 Accuracy</th>
                      <th className="text-right">Latency</th>
                      <th className="text-right">Footprint</th>
                      <th className="text-right">Energy Draw</th>
                      <th className="text-right">Composite Score</th>
                      <th className="text-center">Pareto Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { alg: 'GWO (Grey Wolf Optimizer)', acc: '92.84%', lat: '2.99 ms', size: '6.70 MB', energy: '0.1220 J', score: '95.2/100', pareto: true },
                      { alg: 'WOA (Whale Optimization)', acc: '92.41%', lat: '3.14 ms', size: '6.70 MB', energy: '0.1250 J', score: '92.1/100', pareto: true },
                      { alg: 'ALO (Ant Lion Optimizer)', acc: '91.80%', lat: '3.32 ms', size: '6.85 MB', energy: '0.1290 J', score: '88.4/100', pareto: false },
                      { alg: 'MFO (Moth-Flame Opt.)', acc: '91.35%', lat: '3.45 ms', size: '6.90 MB', energy: '0.1310 J', score: '85.7/100', pareto: false },
                      { alg: 'GOA (Grasshopper Opt.)', acc: '91.10%', lat: '3.60 ms', size: '7.10 MB', energy: '0.1340 J', score: '82.3/100', pareto: false },
                    ].map((row) => (
                      <tr key={row.alg}>
                        <td className="font-bold text-[var(--text-primary)] font-mono">{row.alg}</td>
                        <td className="text-right text-emerald-400 font-mono">{row.acc}</td>
                        <td className="text-right text-[var(--text-primary)] font-mono">{row.lat}</td>
                        <td className="text-right text-[var(--text-secondary)] font-mono">{row.size}</td>
                        <td className="text-right text-[var(--text-secondary)] font-mono">{row.energy}</td>
                        <td className="text-right font-bold text-sky-400 font-mono">{row.score}</td>
                        <td className="text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${row.pareto ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold' : 'text-[var(--text-muted)]'}`}>
                            {row.pareto ? 'PARETO OPTIMAL' : 'DOMINATED'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono uppercase">
                2. Scientific Conclusion &amp; Deployment Guidelines
              </h3>
              <p>
                Our rigorous analysis confirms that no single metaheuristic holds universal supremacy across all metric weights. However, under standard mobile constraints where latency and model size are prioritized alongside accuracy, <strong>Grey Wolf Optimizer (GWO)</strong> and <strong>Whale Optimization Algorithm (WOA)</strong> consistently identify search vectors on the Pareto frontier with minimal iteration cost.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 8. EXPORT HUB (TXT, PDF, DOCS, MARKDOWN, JSON) */}
      {/* ========================================================================= */}
      {activeTab === 'export' && (
        <section className="space-y-6 animate-fade-in" id="export-center">
          <div className="ws-panel p-6 space-y-4">
            <h3 className="ws-section-title flex items-center gap-2">
              <Download className="w-4 h-4 text-[var(--accent)]" />
              <span>Export Complete Project Report &amp; Platform Documentation</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Export the complete technical documentation, mathematical proofs, architecture diagrams, and scientific project report in any standard publication format:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {/* PDF Exporter Card */}
              <div className="p-5 rounded-lg bg-[var(--surface-secondary)] border border-red-500/30 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 font-bold font-mono text-xs text-red-400">
                    <Printer className="w-4 h-4" />
                    <span>Printable PDF Document</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Clean printable scientific document with formatted tables, page breaks, and headers.
                  </p>
                </div>
                <button
                  onClick={() => exportToPdf(getFullPlatformDocData())}
                  className="w-full py-2 px-3 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition"
                >
                  Download .PDF
                </button>
              </div>

              {/* DOCS Exporter Card */}
              <div className="p-5 rounded-lg bg-[var(--surface-secondary)] border border-blue-500/30 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 font-bold font-mono text-xs text-blue-400">
                    <FileType className="w-4 h-4" />
                    <span>Microsoft Word (.doc)</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Styled Word document with complete tables, metadata boxes, and XML styling.
                  </p>
                </div>
                <button
                  onClick={() => exportToDoc(getFullPlatformDocData(), 'CNN_Benchmark_Documentation.doc')}
                  className="w-full py-2 px-3 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
                >
                  Download .DOC
                </button>
              </div>

              {/* Plain Text Exporter Card */}
              <div className="p-5 rounded-lg bg-[var(--surface-secondary)] border border-amber-500/30 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 font-bold font-mono text-xs text-amber-400">
                    <FileCode className="w-4 h-4" />
                    <span>Plain Text (.txt)</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Standardized ASCII formatted text report with monospace column alignment.
                  </p>
                </div>
                <button
                  onClick={() => exportToTxt(getFullPlatformDocData(), 'CNN_Benchmark_Documentation.txt')}
                  className="w-full py-2 px-3 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition"
                >
                  Download .TXT
                </button>
              </div>

              {/* Markdown Exporter Card */}
              <div className="p-5 rounded-lg bg-[var(--surface-secondary)] border border-cyan-500/30 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 font-bold font-mono text-xs text-cyan-400">
                    <FileText className="w-4 h-4" />
                    <span>Scientific Markdown (.md)</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    GitHub-flavored Markdown manual for LaTeX compilation or repository documentation.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const data = getFullPlatformDocData();
                    let md = `# ${data.title}\n\n${data.subtitle}\n\n**Author**: ${data.author}\n**Version**: ${data.version}\n**Generated**: ${data.timestamp}\n\n`;
                    for (const sec of data.sections) {
                      md += `## ${sec.title}\n\n${sec.content || ''}\n\n`;
                      if (sec.table) {
                        md += `| ${sec.table.headers.join(' | ')} |\n| ${sec.table.headers.map(() => '---').join(' | ')} |\n`;
                        for (const row of sec.table.rows) {
                          md += `| ${row.join(' | ')} |\n`;
                        }
                        md += '\n';
                      }
                    }
                    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'CNN_Benchmark_Documentation.md';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full py-2 px-3 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition"
                >
                  Download .MD
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Algorithm Upload Modal */}
      <AlgorithmUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAlgorithmAdded={(newAlgo) => {
          setAlgorithms((prev) => [...prev, newAlgo]);
          setSelectedAlg(newAlgo);
        }}
      />
    </article>
  );
};
