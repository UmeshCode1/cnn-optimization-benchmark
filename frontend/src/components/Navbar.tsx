import React from 'react';
import { Activity, Cpu, HardDrive, Moon, Sun, PlayCircle, RefreshCw } from 'lucide-react';
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
    <header className="h-14 lab-header px-4 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Brand / Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm shadow-blue-500/20 text-xs">
          CNN
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-[var(--text-primary)] tracking-tight">
              CNN OPTIMIZATION BENCHMARK
            </span>
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded font-mono font-semibold">
              v1.0 RESEARCH
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            Standardized Metaheuristic Compression Platform &bull; Real Telemetry
          </p>
        </div>
      </div>

      {/* Center / Right: Hardware Telemetry & Controls */}
      <div className="flex items-center gap-2.5">
        {/* Hardware Status Tag */}
        {hardware && (
          <div className="hidden lg:flex items-center gap-2.5 px-2.5 py-1 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-md text-xs text-[var(--text-secondary)]">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-mono text-[11px] text-[var(--text-primary)]">
                {hardware.device_type === 'GPU' ? hardware.gpu_model : hardware.cpu_model}
              </span>
            </div>
            <div className="h-3 w-px bg-[var(--border-color)]" />
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-[11px]">{hardware.ram_gb} GB RAM</span>
            </div>
          </div>
        )}

        {/* Active Experiment Indicator */}
        {activeExperiment && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-md text-xs">
            <span className="text-[var(--text-muted)] font-mono text-[11px]">Active:</span>
            <span className="font-mono font-medium text-blue-400 text-[11px]">{activeExperiment.id}</span>
            <span
              className={`w-2 h-2 rounded-full ${
                activeExperiment.status === 'RUNNING'
                  ? 'bg-amber-400 animate-pulse'
                  : activeExperiment.status === 'COMPLETED'
                  ? 'bg-emerald-400'
                  : 'bg-slate-500'
              }`}
            />
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh Data"
          className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-blue-500" />
          )}
        </button>

        {/* Main CTA */}
        <button
          onClick={onNewBenchmark}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm transition"
        >
          <PlayCircle className="w-4 h-4" />
          <span>New Benchmark</span>
        </button>
      </div>
    </header>
  );
};
