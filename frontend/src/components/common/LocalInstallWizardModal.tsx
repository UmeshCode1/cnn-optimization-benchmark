import React, { useState, useEffect, useMemo } from 'react';
import {
  Terminal,
  Cpu,
  Zap,
  CheckCircle2,
  X,
  Copy,
  Check,
  Download,
  ExternalLink,
  ShieldCheck,
  HardDrive,
  RefreshCw,
  Sparkles,
  Layers,
  CheckCircle,
  AlertCircle,
  Laptop,
} from 'lucide-react';
import { api } from '../../services/api';
import { InstallerPreflightInfo } from '../../types';

interface LocalInstallWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocalInstallWizardModal: React.FC<LocalInstallWizardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'windows' | 'unix' | 'docker'>('windows');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [preflightInfo, setPreflightInfo] = useState<InstallerPreflightInfo | null>(null);
  const [localDaemonStatus, setLocalDaemonStatus] = useState<{
    isOnline: boolean;
    data?: any;
    lastChecked?: Date;
  }>({ isOnline: false });
  const [isScanning, setIsScanning] = useState(false);

  // ── 1. Client Browser Hardware & OS Pre-flight Detection ──────────────────
  const clientHardware = useMemo(() => {
    const ua = navigator.userAgent;
    let detectedOS = 'Windows';
    if (/Macintosh|Mac OS X/i.test(ua)) detectedOS = 'macOS';
    else if (/Linux/i.test(ua)) detectedOS = 'Linux / WSL';

    // Probe WebGL hardware renderer to discover physical GPU
    let gpuName = 'Standard Display Graphics';
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          gpuName =
            (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) ||
            gpuName;
        }
      }
    } catch {}

    const cpuCores = navigator.hardwareConcurrency || 8;
    const ramGb = (navigator as any).deviceMemory || '>= 8';

    return {
      os: detectedOS,
      gpu: gpuName,
      cpuCores,
      ramGb,
      is64Bit: /x86_64|Win64|WOW64|x64|Macintosh/i.test(ua),
    };
  }, []);

  // Set default tab based on client OS
  useEffect(() => {
    if (clientHardware.os === 'macOS' || clientHardware.os.includes('Linux')) {
      setActiveTab('unix');
    } else {
      setActiveTab('windows');
    }
  }, [clientHardware.os]);

  // ── 2. Fetch Preflight Spec from Backend ──────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      api.getInstallerPreflight()
        .then((res) => setPreflightInfo(res))
        .catch((err) => console.warn('Could not load dynamic preflight info:', err));
    }
  }, [isOpen]);

  // ── 3. Real-Time Local Engine Prober ──────────────────────────────────────
  const checkLocalDaemon = async () => {
    setIsScanning(true);
    const probe = await api.probeLocalDaemon(8000);
    setLocalDaemonStatus({
      isOnline: probe.isRunning,
      data: probe.data,
      lastChecked: new Date(),
    });
    setIsScanning(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    checkLocalDaemon();
    const interval = setInterval(checkLocalDaemon, 3500);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const currentHost = window.location.origin;
  const ps1Command =
    preflightInfo?.commands.windows_powershell ||
    `powershell -ExecutionPolicy Bypass -Command "irm ${currentHost}/install.ps1 | iex"`;
  const unixCommand =
    preflightInfo?.commands.mac_linux_bash ||
    `curl -fsSL ${currentHost}/install.sh | bash`;
  const dockerCommand =
    preflightInfo?.commands.docker_compose ||
    'git clone https://github.com/UmeshCode1/cnn-optimization-benchmark.git && cd cnn-optimization-benchmark && docker compose -f docker-compose.yml -f docker-compose.gpu.yml up --build';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-[var(--surface-primary)] border border-[var(--border-strong)] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-[var(--border)] bg-gradient-to-r from-blue-500/10 via-amber-500/5 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-blue-500/20 text-amber-400 border border-amber-500/30 shadow-xs">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  1-Click Local Laptop Automated Installer
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider font-semibold">
                  Zero Config
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                Automatically scans laptop hardware, installs PyTorch with CUDA/CPU, and launches Real Experiment Mode
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Live Pre-flight Laptop Diagnostic Card */}
          <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--text-primary)]">
                <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
                <span>LAPTOP PRE-FLIGHT HARDWARE TELEMETRY</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)]">
                <span>Client Engine:</span>
                <strong className="text-emerald-400">{clientHardware.os}</strong>
                <span>&bull;</span>
                <span>{clientHardware.is64Bit ? '64-bit Architecture' : '32-bit'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-black/30 border border-black/20 space-y-1">
                <div className="text-[10px] text-[var(--text-muted)] uppercase">Detected Graphics</div>
                <div className="font-bold text-[var(--text-primary)] truncate" title={clientHardware.gpu}>
                  {clientHardware.gpu}
                </div>
                <div className="text-[10px] text-emerald-400">
                  {clientHardware.gpu.toLowerCase().includes('nvidia')
                    ? 'NVIDIA CUDA Acceleration Supported'
                    : clientHardware.gpu.toLowerCase().includes('apple')
                    ? 'Apple Silicon Metal Acceleration'
                    : 'CPU Acceleration Ready'}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-black/30 border border-black/20 space-y-1">
                <div className="text-[10px] text-[var(--text-muted)] uppercase">Compute CPU Cores</div>
                <div className="font-bold text-[var(--text-primary)]">
                  {clientHardware.cpuCores} Logical Threads
                </div>
                <div className="text-[10px] text-blue-400">Multi-threaded Inference Ready</div>
              </div>

              <div className="p-2.5 rounded-lg bg-black/30 border border-black/20 space-y-1">
                <div className="text-[10px] text-[var(--text-muted)] uppercase">System Memory (RAM)</div>
                <div className="font-bold text-[var(--text-primary)]">
                  {clientHardware.ramGb} GB Device RAM
                </div>
                <div className="text-[10px] text-indigo-400">Optimal for CIFAR & ImageNet Subsets</div>
              </div>
            </div>
          </div>

          {/* Live Local Daemon Connection Radar */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              localDaemonStatus.isOnline
                ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900/50 border-[var(--border)] text-[var(--text-secondary)]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className={`w-3.5 h-3.5 rounded-full ${
                      localDaemonStatus.isOnline
                        ? 'bg-emerald-400 animate-pulse'
                        : 'bg-amber-400/80 animate-ping'
                    }`}
                  />
                  {!localDaemonStatus.isOnline && (
                    <div className="w-3.5 h-3.5 rounded-full bg-amber-500 absolute inset-0 opacity-70" />
                  )}
                </div>

                <div>
                  <div className="text-xs font-mono font-bold flex items-center gap-2">
                    {localDaemonStatus.isOnline ? (
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" />
                        LOCAL WORKSTATION ENGINE ACTIVE &amp; CONNECTED (localhost:8000)
                      </span>
                    ) : (
                      <span className="text-amber-300 flex items-center gap-1.5">
                        <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                        Waiting for local runner... (Listening on http://localhost:8000)
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                    {localDaemonStatus.isOnline
                      ? `Execution Mode: REAL • ${localDaemonStatus.data?.capabilities?.gpu_model || 'CPU Inference'} • PyTorch ${localDaemonStatus.data?.capabilities?.pytorch_version || 'Ready'}`
                      : 'Run the 1-click command below on your laptop to automatically launch the local GPU engine.'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {localDaemonStatus.isOnline ? (
                  <a
                    href="http://localhost:8000"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs flex items-center gap-1.5 shadow-md hover:bg-emerald-400 transition"
                  >
                    <span>Open Local Workstation</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <button
                    onClick={checkLocalDaemon}
                    className="px-3 py-1 rounded bg-[var(--surface-secondary)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-secondary)] transition cursor-pointer"
                  >
                    Ping Port 8000
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Installer Platform Selector Tabs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('windows')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'windows'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Windows (PowerShell)</span>
                </button>

                <button
                  onClick={() => setActiveTab('unix')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'unix'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>macOS / Linux / WSL (Bash)</span>
                </button>

                <button
                  onClick={() => setActiveTab('docker')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'docker'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Docker Container</span>
                </button>
              </div>

              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                Selected: {activeTab === 'windows' ? 'Windows 10/11' : activeTab === 'unix' ? 'macOS / Linux' : 'Docker Compose'}
              </span>
            </div>

            {/* Tab 1: Windows Automated PowerShell Setup */}
            {activeTab === 'windows' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-b from-blue-950/20 to-black/40 border border-blue-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-blue-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Option A: 1-Line PowerShell Auto-Install (Paste into PowerShell)
                    </span>
                    <button
                      onClick={() => copyText(ps1Command, 'ps1')}
                      className="px-2.5 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedId === 'ps1' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Command</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-3 bg-black/60 rounded-lg border border-black/40 text-xs font-mono text-emerald-400 break-all select-all">
                    {ps1Command}
                  </div>

                  <div className="text-[11px] text-[var(--text-muted)] font-mono leading-relaxed">
                    💡 <em>Open PowerShell on your laptop, paste the command above, and press Enter. It automatically installs Python, PyTorch, configures CUDA, and creates a desktop shortcut.</em>
                  </div>
                </div>

                {/* Option B: Download .bat / .ps1 */}
                <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-[var(--text-primary)] font-mono">
                      Option B: Double-Clickable Desktop Launcher
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                      Download standalone <code>install.bat</code> and run it anytime on Windows.
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`${currentHost}/install.bat`}
                      download="install.bat"
                      className="px-3 py-1.5 rounded-lg bg-[var(--surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)] flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>Download install.bat</span>
                    </a>
                    <a
                      href={`${currentHost}/install.ps1`}
                      download="install.ps1"
                      className="px-3 py-1.5 rounded-lg bg-[var(--surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)] flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-400" />
                      <span>Download install.ps1</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: macOS / Linux / WSL */}
            {activeTab === 'unix' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-b from-blue-950/20 to-black/40 border border-blue-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-blue-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      1-Line Terminal Auto-Install (Paste into Terminal)
                    </span>
                    <button
                      onClick={() => copyText(unixCommand, 'unix')}
                      className="px-2.5 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedId === 'unix' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Command</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-3 bg-black/60 rounded-lg border border-black/40 text-xs font-mono text-emerald-400 break-all select-all">
                    {unixCommand}
                  </div>

                  <div className="text-[11px] text-[var(--text-muted)] font-mono leading-relaxed">
                    💡 <em>Compatible with macOS (M1/M2/M3 Metal MPS & Intel), Ubuntu, Debian, Fedora, Arch, and Windows Subsystem for Linux (WSL2).</em>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-[var(--text-primary)] font-mono">
                      Download Shell Script
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                      Save <code>install.sh</code> locally and execute with <code>chmod +x install.sh &amp;&amp; ./install.sh</code>
                    </div>
                  </div>

                  <a
                    href={`${currentHost}/install.sh`}
                    download="install.sh"
                    className="px-3 py-1.5 rounded-lg bg-[var(--surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)] flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>Download install.sh</span>
                  </a>
                </div>
              </div>
            )}

            {/* Tab 3: Docker */}
            {activeTab === 'docker' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-b from-blue-950/20 to-black/40 border border-blue-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-blue-300 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-blue-400" />
                      Docker Compose Multi-Stage Build (GPU &amp; CPU)
                    </span>
                    <button
                      onClick={() => copyText(dockerCommand, 'docker')}
                      className="px-2.5 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedId === 'docker' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Command</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-3 bg-black/60 rounded-lg border border-black/40 text-xs font-mono text-emerald-400 overflow-x-auto">
                    {dockerCommand}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Automated Setup Workflow Steps */}
          <div className="p-4 rounded-xl bg-[var(--surface-secondary)]/50 border border-[var(--border)] space-y-3 text-xs font-mono">
            <div className="font-bold text-[var(--text-primary)] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>WHAT THE AUTOMATED INSTALLER DOES ON YOUR LAPTOP:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] text-[var(--text-secondary)]">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">1.</span>
                <span>Auto-detects Python 3.9+ (or installs it via winget if missing)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">2.</span>
                <span>Probes NVIDIA GPU &amp; CUDA; selects optimized PyTorch wheels</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">3.</span>
                <span>Creates isolated virtual environment <code>.venv</code> (no global pollution)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">4.</span>
                <span>Sets up SQLite DB, NVML telemetry &amp; creates Desktop launch shortcut</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-secondary)] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
            <span>Platform GitHub:</span>
            <a
              href="https://github.com/UmeshCode1/cnn-optimization-benchmark"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--accent)] hover:underline flex items-center gap-1"
            >
              <span>UmeshCode1/cnn-optimization-benchmark</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg ws-button-primary text-xs font-mono font-bold cursor-pointer"
          >
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
};
