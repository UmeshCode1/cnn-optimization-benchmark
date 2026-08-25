import React from 'react';
import { Activity, Cpu, HardDrive, Moon, Sun, ShieldCheck, PlayCircle, RefreshCw } from 'lucide-react';
import { HardwareProfile, Experiment } from '../types';

interface NavbarProps {
  hardware?: HardwareProfile;
  activeExperiment?: Experiment;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onNewBenchmark: () => void;
  onRefresh: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  hardware,
  activeExperiment,
  theme,
  toggleTheme,
  onNewBenchmark,
  onRefresh,
}) => {
  return (
    <header className="h-14 border-b border-slate-800 bg-[#0d131f] px-4 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Brand / Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm shadow-blue-500/20">
          CNN
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-100 tracking-wide">CNN OPTIMIZATION BENCHMARK</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-blue-950 text-blue-400 border border-blue-800 rounded font-mono">
              v1.0 RESEARCH
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Fair Metaheuristic Comparative Platform &bull; 10 Optimizers &bull; Real Measurements
          </p>
        </div>
      </div>

      {/* Center / Right: Hardware Telemetry & Controls */}
      <div className="flex items-center gap-3">
        {/* Hardware Status Tag */}
        {hardware && (
          <div className="hidden lg:flex items-center gap-3 px-2.5 py-1 bg-slate-900/90 border border-slate-800 rounded text-xs text-slate-300">
            <div className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-mono text-[11px] text-slate-200">{hardware.device_type === 'GPU' ? hardware.gpu_model : hardware.cpu_model}</span>
            </div>
            <div className="h-3 w-px bg-slate-700" />
            <div className="flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-[11px]">{hardware.ram_gb} GB RAM</span>
            </div>
          </div>
        )}

        {/* Active Experiment Indicator */}
        {activeExperiment && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-xs">
            <span className="text-slate-400 font-mono text-[11px]">Active:</span>
            <span className="font-mono font-medium text-blue-300 text-[11px]">{activeExperiment.id}</span>
            <span className={`w-2 h-2 rounded-full ${
              activeExperiment.status === 'RUNNING' ? 'bg-amber-400 animate-pulse' :
              activeExperiment.status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-slate-500'
            }`} />
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          title="Refresh Data"
          className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title="Toggle Theme"
          className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-blue-300" />}
        </button>

        {/* Main CTA */}
        <button
          onClick={onNewBenchmark}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm transition"
        >
          <PlayCircle className="w-4 h-4" />
          <span>New Benchmark</span>
        </button>
      </div>
    </header>
  );
};
