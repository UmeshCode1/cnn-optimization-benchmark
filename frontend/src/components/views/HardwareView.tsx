import React from 'react';
import { Cpu, HardDrive, Zap, Terminal, ShieldAlert } from 'lucide-react';
import { HardwareProfile } from '../../types';

interface HardwareViewProps {
  hardware?: HardwareProfile;
}

export const HardwareView: React.FC<HardwareViewProps> = ({ hardware }) => {
  if (!hardware) {
    return <div className="lab-card p-6 text-center text-xs text-[var(--text-muted)]">Hardware profile loading...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-500" />
            BENCHMARK HARDWARE TELEMETRY &amp; ENVIRONMENT
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Hardware configuration under which all latency, energy, and execution measurements were collected.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Processor Card */}
        <div className="lab-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-blue-500" />
            <span>Compute Architecture</span>
          </div>
          <div className="space-y-2 text-xs font-mono text-[var(--text-secondary)]">
            <div>
              <span className="text-[var(--text-muted)] text-[11px] block">Primary Device:</span>
              <strong className="text-[var(--text-primary)] text-sm">{hardware.device_name}</strong>
            </div>
            <div>
              <span className="text-[var(--text-muted)] text-[11px] block">CPU Model:</span>
              <span className="text-[var(--text-primary)]">{hardware.cpu_model}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] text-[11px] block">Logical Cores:</span>
              <span className="text-[var(--text-primary)]">{hardware.cpu_cores} Cores</span>
            </div>
          </div>
        </div>

        {/* GPU & Memory Card */}
        <div className="lab-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Accelerator &amp; Memory</span>
          </div>
          <div className="space-y-2 text-xs font-mono text-[var(--text-secondary)]">
            <div>
              <span className="text-[var(--text-muted)] text-[11px] block">GPU Model:</span>
              <strong className="text-[var(--text-primary)]">{hardware.gpu_model}</strong>
            </div>
            <div>
              <span className="text-[var(--text-muted)] text-[11px] block">Host System RAM:</span>
              <span className="text-emerald-500 font-bold">{hardware.ram_gb} GB</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] text-[11px] block">CUDA Toolkit:</span>
              <span className="text-cyan-500">{hardware.cuda_version}</span>
            </div>
          </div>
        </div>

        {/* Software & Runtime Card */}
        <div className="lab-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
            <Terminal className="w-4 h-4 text-purple-500" />
            <span>Software &amp; ML Runtime</span>
          </div>
          <div className="space-y-2 text-xs font-mono text-[var(--text-secondary)]">
            <div>
              <span className="text-[var(--text-muted)] text-[11px] block">Operating System:</span>
              <span className="text-[var(--text-primary)]">{hardware.os_info}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] text-[11px] block">PyTorch Framework:</span>
              <span className="text-[var(--text-primary)]">{hardware.torch_version}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] text-[11px] block">Python Runtime:</span>
              <span className="text-[var(--text-primary)]">v{hardware.python_version}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hardware Comparability Disclaimer */}
      <div className="lab-card p-4 bg-amber-500/5 border-amber-500/30 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--text-secondary)] space-y-1">
          <div className="font-bold text-[var(--text-primary)] font-mono text-xs">
            Scientific Comparability Rule:
          </div>
          <p className="leading-relaxed">
            Inference latencies and energy metrics must never be directly compared across differing hardware architectures without explicitly stating the hardware profile and synchronizing thread counts.
          </p>
        </div>
      </div>
    </div>
  );
};
