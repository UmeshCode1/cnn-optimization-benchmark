import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Terminal,
  ExternalLink,
  Laptop,
  Check,
} from 'lucide-react';
import { Experiment, SystemCapabilities } from '../../types';
import { LocalInstallWizardModal } from './LocalInstallWizardModal';
import { api } from '../../services/api';

interface ExecutionModeBannerProps {
  experiment?: Experiment;
  capabilities?: SystemCapabilities;
}

export const ExecutionModeBanner: React.FC<ExecutionModeBannerProps> = ({
  experiment,
  capabilities,
}) => {
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [localDaemonOnline, setLocalDaemonOnline] = useState(false);

  const isRealMode =
    experiment?.execution_mode === 'REAL' ||
    (!experiment && capabilities?.default_mode === 'REAL');

  // Background probe to see if laptop local daemon is running on localhost:8000
  useEffect(() => {
    if (isRealMode) return;
    const check = async () => {
      const probe = await api.probeLocalDaemon(8000);
      setLocalDaemonOnline(probe.isRunning);
    };
    check();
    const timer = setInterval(check, 5000);
    return () => clearInterval(timer);
  }, [isRealMode]);

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

        <div className="flex items-center gap-2 flex-wrap">
          {!isRealMode && (
            <>
              {localDaemonOnline && (
                <a
                  href="http://localhost:8000"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-sans font-semibold transition cursor-pointer animate-pulse"
                >
                  <Check className="w-3 h-3" />
                  <span>Local Workstation Active (localhost:8000) &rarr;</span>
                </a>
              )}

              <button
                onClick={() => setShowWizardModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-gradient-to-r from-amber-500/25 to-blue-500/25 hover:from-amber-500/35 hover:to-blue-500/35 text-amber-200 border border-amber-500/40 text-[11px] font-sans font-semibold transition cursor-pointer shadow-xs"
              >
                <Laptop className="w-3.5 h-3.5 text-amber-300" />
                <span>1-Click Install Locally on Laptop</span>
              </button>
            </>
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

      {/* 1-Click Local Laptop Install Wizard Modal */}
      <LocalInstallWizardModal
        isOpen={showWizardModal}
        onClose={() => setShowWizardModal(false)}
      />
    </>
  );
};

