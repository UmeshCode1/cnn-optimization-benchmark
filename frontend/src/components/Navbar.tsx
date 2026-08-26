import React from 'react';
import { Cpu, HardDrive, Moon, Sun, PlayCircle, RefreshCw } from 'lucide-react';
import { HardwareProfile, Experiment } from '../types';

interface NavbarProps {
  hardware?: HardwareProfile;
  activeExperiment?: Experiment;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onNewBenchmark: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  hardware,
  activeExperiment,
  theme,
  toggleTheme,
  onNewBenchmark,
  onRefresh,
  isRefreshing = false,
}) => {
  return (
    <header className="h-14 ws-header px-4 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Left: Scientific Brand & Platform Designation */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded bg-[var(--accent)] flex items-center justify-center font-mono font-semibold text-white text-xs">
          CNN
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-[var(--text-primary)] tracking-tight">
              CNN Optimization Benchmark
            </span>
            <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">
              / Research Instrumentation
            </span>
          </div>
        </div>
      </div>

      {/* Center & Right: Real-time Telemetry & Global Controls */}
      <div className="flex items-center gap-4 text-xs font-mono">
        {/* Active Experiment Telemetry */}
        {activeExperiment && (
          <div className="hidden md:flex items-center gap-2 text-[var(--text-secondary)]">
            <span className="text-[var(--text-muted)]">Active:</span>
            <span className="font-semibold text-[var(--text-primary)]">{activeExperiment.id}</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                activeExperiment.status === 'RUNNING'
                  ? 'bg-[var(--warning)] animate-pulse'
                  : activeExperiment.status === 'COMPLETED'
                  ? 'bg-[var(--success)]'
                  : 'bg-[var(--text-muted)]'
              }`}
            />
          </div>
        )}

        {/* Hardware Telemetry Summary */}
        {hardware && (
          <div className="hidden lg:flex items-center gap-3 text-[var(--text-secondary)] border-l border-[var(--border)] pl-4">
            <div className="flex items-center gap-1.5" title={hardware.cpu_model}>
              <Cpu className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className="truncate max-w-[160px]">{hardware.device_name}</span>
            </div>
            <span className="text-[var(--border-strong)]">&bull;</span>
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>{hardware.ram_gb} GB RAM</span>
            </div>
          </div>
        )}

        {/* Actions Group */}
        <div className="flex items-center gap-1.5 border-l border-[var(--border)] pl-3">
          {/* Refresh Action */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh benchmark data"
            className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[var(--accent)]' : ''}`} />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-[var(--warning)]" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-[var(--accent)]" />
            )}
          </button>

          {/* Primary CTA */}
          <button
            onClick={onNewBenchmark}
            className="ml-1 flex items-center gap-1.5 px-3 py-1.5 ws-button-primary"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span className="font-sans font-medium text-xs">New Benchmark</span>
          </button>
        </div>
      </div>
    </header>
  );
};
