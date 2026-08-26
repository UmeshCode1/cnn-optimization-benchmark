import React, { useState, useRef, useEffect } from 'react';
import {
  Cpu,
  HardDrive,
  Moon,
  Sun,
  PlayCircle,
  RefreshCw,
  ChevronDown,
  Database,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { HardwareProfile, Experiment } from '../types';

interface NavbarProps {
  hardware?: HardwareProfile;
  activeExperiment?: Experiment;
  experiments?: Experiment[];
  onSelectExperiment?: (expId: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onNewBenchmark: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  hardware,
  activeExperiment,
  experiments = [],
  onSelectExperiment,
  theme,
  toggleTheme,
  onNewBenchmark,
  onRefresh,
  isRefreshing = false,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
              / Research Workstation
            </span>
          </div>
        </div>
      </div>

      {/* Center & Right: Interactive Switcher, Storage Telemetry & Global Controls */}
      <div className="flex items-center gap-3 text-xs font-mono">
        {/* Interactive Active Experiment Switcher Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-[var(--border)] bg-[var(--surface-secondary)] hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title="Click to switch active experiment"
          >
            <span className="text-[var(--text-muted)]">Active:</span>
            <span className="font-semibold text-[var(--text-primary)]">
              {activeExperiment?.id || 'No Experiment'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                activeExperiment?.status === 'RUNNING'
                  ? 'bg-[var(--warning)] animate-pulse'
                  : activeExperiment?.status === 'COMPLETED'
                  ? 'bg-[var(--success)]'
                  : 'bg-[var(--text-muted)]'
              }`}
            />
            <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute left-0 mt-1 w-72 ws-panel p-2 shadow-xl z-50 space-y-1 font-mono text-xs border border-[var(--border-strong)]">
              <div className="px-2 py-1 text-[10px] text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)] flex items-center justify-between">
                <span>Stored Experiments ({experiments.length})</span>
                <Database className="w-3 h-3 text-[var(--accent)]" />
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1 pt-1">
                {experiments.map((exp) => {
                  const isSelected = exp.id === activeExperiment?.id;
                  return (
                    <div
                      key={exp.id}
                      onClick={() => {
                        if (onSelectExperiment) onSelectExperiment(exp.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`p-2 rounded cursor-pointer transition-colors flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] border border-[var(--accent)]'
                          : 'hover:bg-[var(--surface-secondary)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[var(--text-primary)]">{exp.id}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                            exp.status === 'COMPLETED'
                              ? 'bg-[var(--success)]/10 text-[var(--success)]'
                              : 'bg-[var(--warning)]/10 text-[var(--warning)]'
                          }`}
                        >
                          {exp.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5 font-sans">
                        {exp.dataset_name} &bull; {exp.cnn_model_name}
                      </div>
                    </div>
                  );
                })}
                {experiments.length === 0 && (
                  <div className="p-3 text-center text-[var(--text-muted)] text-xs">
                    No experiments saved in database.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Hardware & Persistent Storage Telemetry */}
        {hardware && (
          <div className="hidden lg:flex items-center gap-2.5 text-[var(--text-secondary)] border-l border-[var(--border)] pl-3">
            <div className="flex items-center gap-1.5" title={hardware.cpu_model}>
              <Cpu className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className="truncate max-w-[140px]">{hardware.device_name}</span>
            </div>
            <span className="text-[var(--border-strong)]">&bull;</span>
            <div className="flex items-center gap-1.5" title="Host System RAM">
              <HardDrive className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>{hardware.ram_gb} GB RAM</span>
            </div>
            <span className="text-[var(--border-strong)]">&bull;</span>
            <div className="flex items-center gap-1.5" title="SQLite Database Persistence">
              <Database className="w-3.5 h-3.5 text-[var(--success)]" />
              <span className="text-[var(--success)]">{experiments.length} Saved</span>
            </div>
          </div>
        )}

        {/* Actions Group */}
        <div className="flex items-center gap-1.5 border-l border-[var(--border)] pl-2.5">
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
