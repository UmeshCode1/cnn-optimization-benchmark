import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Info,
  Terminal,
  ExternalLink,
  X,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { Experiment, SystemCapabilities } from '../../types';

interface ExecutionModeBannerProps {
  experiment?: Experiment;
  capabilities?: SystemCapabilities;
}

export const ExecutionModeBanner: React.FC<ExecutionModeBannerProps> = ({
  experiment,
  capabilities,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const isRealMode = experiment?.execution_mode === 'REAL' || (!experiment && capabilities?.default_mode === 'REAL');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <>
      <div
        className={`w-full px-4 py-2 text-xs font-mono border-b flex flex-wrap items-center justify-between gap-2 transition-all ${
          isRealMode
            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
            : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {isRealMode ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40 uppercase tracking-wider text-[10px]">
              <CheckCircle2 className="w-3 h-3" />
              REAL EXPERIMENT MODE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/40 uppercase tracking-wider text-[10px]">
              <AlertTriangle className="w-3 h-3" />
              DEMO / SIMULATION MODE
            </span>
          )}

          <span className="text-[11px] opacity-90">
            {isRealMode ? (
              <span>
                Metrics are <strong className="text-emerald-200">MEASURED</strong> directly via PyTorch forward pass & hardware telemetry.
              </span>
            ) : (
              <span>
                Cloud Sandbox active. Metrics are <strong className="text-amber-200">SIMULATED / ESTIMATED</strong> via calibrated analytical models.
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isRealMode && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-sans font-medium transition cursor-pointer"
            >
              <Terminal className="w-3 h-3" />
              <span>Run Locally for Real GPU Results</span>
            </button>
          )}

          <a
            href="https://github.com/UmeshCode1/cnn-optimization-benchmark"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[var(--surface-secondary)] hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] text-[11px] font-sans transition"
          >
            <span>GitHub</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>

      {/* Local Hosting Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-[var(--surface-primary)] border border-[var(--border-strong)] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[var(--text-primary)]">
                    Run Real Experiment Mode on Your Machine
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] font-mono">
                    Execute genuine PyTorch CNN inference with NVIDIA NVML / Intel RAPL telemetry
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded hover:bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-[var(--text-secondary)]">
              <p>
                The cloud web instance (Render Free Tier) runs in <strong>DEMO MODE</strong> because serverless tiers do not provide dedicated GPUs or root RAPL counters. To benchmark real models with 100% genuine measurements:
              </p>

              {/* Option 1: Docker Compose */}
              <div className="p-3.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Option 1: Quickstart with Docker Compose (Recommended)
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        'git clone https://github.com/UmeshCode1/cnn-optimization-benchmark.git\ncd cnn-optimization-benchmark\ndocker compose -f docker-compose.yml -f docker-compose.gpu.yml up --build',
                        'docker'
                      )
                    }
                    className="p-1 rounded hover:bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                    title="Copy command"
                  >
                    {copiedCmd === 'docker' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <pre className="p-2.5 rounded bg-black/40 text-[11px] font-mono text-[var(--text-primary)] overflow-x-auto border border-black/20">
                  git clone https://github.com/UmeshCode1/cnn-optimization-benchmark.git{'\n'}
                  cd cnn-optimization-benchmark{'\n'}
                  docker compose -f docker-compose.yml -f docker-compose.gpu.yml up --build
                </pre>
              </div>

              {/* Option 2: Python Runner */}
              <div className="p-3.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-[var(--accent)]" />
                    Option 2: Native Python & PyTorch (CPU / CUDA)
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        'pip install -r backend/requirements.txt\npython local_runner.py --model ResNet-18 --dataset CIFAR-10 --runs 5',
                        'python'
                      )
                    }
                    className="p-1 rounded hover:bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                    title="Copy command"
                  >
                    {copiedCmd === 'python' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <pre className="p-2.5 rounded bg-black/40 text-[11px] font-mono text-[var(--text-primary)] overflow-x-auto border border-black/20">
                  pip install -r backend/requirements.txt{'\n'}
                  python local_runner.py --model ResNet-18 --dataset CIFAR-10 --runs 5
                </pre>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-950/20 border border-blue-500/20 text-blue-300 text-[11px]">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                <div>
                  <strong>Provenance Guarantee:</strong> When executed locally with PyTorch, every metric is saved with <code>provenance: "MEASURED"</code> and source <code>"MODEL_INFERENCE"</code> or <code>"NVIDIA_NVML"</code>.
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[var(--border)]">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-1.5 rounded ws-button-primary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
