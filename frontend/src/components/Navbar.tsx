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
  Search,
  ArrowRight,
  Menu,
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
  onToggleMobileSidebar?: () => void;
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
  onToggleMobileSidebar = () => {},
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredExperiments = experiments.filter((exp) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      exp.id.toLowerCase().includes(q) ||
      exp.title.toLowerCase().includes(q) ||
      exp.dataset_name.toLowerCase().includes(q) ||
      exp.cnn_model_name.toLowerCase().includes(q)
    );
  });

  return (
    <header className="h-14 ws-header px-4 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Left: Hamburger Menu (Mobile) + Scientific Brand */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onToggleMobileSidebar}
          className="p-1.5 rounded md:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition cursor-pointer"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="w-7 h-7 rounded bg-[var(--accent)] flex items-center justify-center font-mono font-bold text-white text-xs shadow-sm shrink-0">
          CNN
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-[var(--text-primary)] tracking-tight truncate max-w-[170px] sm:max-w-none">
              CNN Benchmark
            </span>
            <span className="text-[11px] text-[var(--text-muted)] hidden md:inline">
              / Research Workstation
            </span>
          </div>
        </div>
      </div>

        {/* Center & Right: Interactive Switcher, Storage Telemetry & Global Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-mono">
          {/* Execution Mode Pill */}
          <div className="hidden sm:flex items-center">
            {activeExperiment?.execution_mode === 'REAL' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30 text-[10px]">
                <CheckCircle2 className="w-2.5 h-2.5" />
                REAL MODE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30 text-[10px]">
                SANDBOX / DEMO
              </span>
            )}
          </div>

          {/* Interactive Active Experiment Switcher Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded border border-[var(--border)] bg-[var(--surface-secondary)] hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer shadow-sm text-xs"
              title="Click to search & switch active experiment"
            >
              <span className="text-[var(--text-muted)] hidden md:inline">Active:</span>
              <span className="font-semibold text-[var(--text-primary)] truncate max-w-[80px] sm:max-w-[120px]">
                {activeExperiment?.id || 'No Exp'}
              </span>
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  activeExperiment?.status === 'RUNNING'
                    ? 'bg-[var(--warning)] animate-pulse'
                    : activeExperiment?.status === 'COMPLETED'
                    ? 'bg-[var(--success)]'
                    : 'bg-[var(--text-muted)]'
                }`}
              />
              <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
            </button>

            {/* Searchable Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 sm:left-0 mt-1 w-72 sm:w-80 ws-panel p-2.5 shadow-2xl z-50 space-y-2 font-mono text-xs border border-[var(--border-strong)] animate-fade-in">
                <div className="px-1 text-[10px] text-[var(--text-muted)] uppercase tracking-wider flex items-center justify-between font-bold">
                  <span>Stored Experiments ({experiments.length})</span>
                  <span className="text-[var(--success)] flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    <span>SQLite</span>
                  </span>
                </div>

                {/* Instant Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type experiment name or ID..."
                    className="w-full pl-8 pr-2.5 py-1.5 ws-input text-[11px] font-mono"
                    autoFocus
                  />
                </div>

                {/* Experiment Options List */}
                <div className="max-h-64 overflow-y-auto space-y-1 pt-1">
                  {filteredExperiments.map((exp) => {
                    const isSelected = exp.id === activeExperiment?.id;
                    return (
                      <div
                        key={exp.id}
                        onClick={() => {
                          if (onSelectExperiment) onSelectExperiment(exp.id);
                          setIsDropdownOpen(false);
                          setSearchQuery('');
                        }}
                        className={`p-2 rounded cursor-pointer transition-all flex flex-col justify-between border ${
                          isSelected
                            ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] border-[var(--accent)] shadow-sm'
                            : 'hover:bg-[var(--surface-secondary)] text-[var(--text-secondary)] border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[var(--text-primary)]">{exp.id}</span>
                            {isSelected && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-[var(--accent)]/10 text-[var(--accent)] font-bold">
                                ACTIVE
                              </span>
                            )}
                          </div>
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
                        <div className="text-[11px] text-[var(--text-muted)] mt-1 font-sans">
                          {exp.dataset_name} &bull; <strong className="text-[var(--text-primary)]">{exp.cnn_model_name}</strong>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] mt-1 font-mono">
                          {exp.best_algorithm ? (
                            <span className="text-[var(--accent)] font-semibold">Winner: {exp.best_algorithm}</span>
                          ) : (
                            <span>--</span>
                          )}
                          <span>{exp.created_at ? exp.created_at.slice(0, 10) : ''}</span>
                        </div>
                      </div>
                    );
                  })}
                  {filteredExperiments.length === 0 && (
                    <div className="p-4 text-center text-[var(--text-muted)] text-xs font-sans">
                      No experiments found matching "{searchQuery}".
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* External Links: GitHub & Render */}
          <div className="hidden lg:flex items-center gap-1 border-l border-[var(--border)] pl-2">
            <a
              href="https://github.com/UmeshCode1/cnn-optimization-benchmark"
              target="_blank"
              rel="noreferrer"
              title="View source repository on GitHub"
              className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors flex items-center gap-1 text-[11px] font-sans"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </a>

            <a
              href="https://cnn.umeshlabs.in/"
              target="_blank"
              rel="noreferrer"
              title="Cloud deployment hosted on Render"
              className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors flex items-center gap-1 text-[11px] font-sans text-emerald-400/90"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Cloud</span>
            </a>
          </div>

          {/* Actions Group */}
          <div className="flex items-center gap-1 sm:gap-1.5 border-l border-[var(--border)] pl-1.5 sm:pl-2">
            {/* Refresh Action */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh benchmark data"
              className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[var(--accent)]' : ''}`} />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer"
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
              className="ml-1 flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 ws-button-primary text-xs shrink-0"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span className="font-sans font-medium hidden sm:inline">New Benchmark</span>
              <span className="font-sans font-medium sm:hidden">Run</span>
            </button>
          </div>
        </div>
      </header>
    );
  };
