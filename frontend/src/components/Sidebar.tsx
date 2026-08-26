import React from 'react';
import {
  LayoutDashboard,
  PlayCircle,
  BarChart3,
  GitFork,
  TrendingDown,
  Layers,
  Layers2,
  Cpu,
  BookOpen,
  FileText,
  History,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'wizard'
  | 'datasets'
  | 'results'
  | 'pareto'
  | 'convergence'
  | 'statistics'
  | 'ablation'
  | 'hardware'
  | 'documentation'
  | 'reports'
  | 'history';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  completedExperimentsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  completedExperimentsCount,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'wizard', label: 'New Benchmark', icon: PlayCircle, highlight: true },
    { id: 'datasets', label: 'Datasets & Upload', icon: Layers },
    { id: 'results', label: 'Benchmark Results', icon: BarChart3, badge: completedExperimentsCount > 0 ? String(completedExperimentsCount) : undefined },
    { id: 'pareto', label: 'Pareto Front', icon: GitFork },
    { id: 'convergence', label: 'Convergence Curves', icon: TrendingDown },
    { id: 'statistics', label: 'Multi-Run Statistics', icon: Layers2 },
    { id: 'ablation', label: 'Ablation Study', icon: Layers },
    { id: 'history', label: 'Experiment History', icon: History },
    { id: 'hardware', label: 'Hardware Telemetry', icon: Cpu },
    { id: 'documentation', label: '10 Optimizers & Docs', icon: BookOpen },
    { id: 'reports', label: 'Research Reports', icon: FileText },
  ];

  return (
    <aside className="w-60 lab-sidebar flex flex-col justify-between h-[calc(100vh-3.5rem)] sticky top-14 select-none">
      <div className="py-3 px-2">
        <div className="px-3 py-1 mb-2 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
          Research Navigation
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as NavTab)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-500 font-semibold border border-blue-500/30'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-500' : 'text-[var(--text-muted)]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom info panel */}
      <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-card)] text-[11px] text-[var(--text-muted)]">
        <div className="flex items-center justify-between font-mono text-[10px] mb-1">
          <span className="font-semibold">OPTIMIZERS</span>
          <span className="text-emerald-500 font-bold">10 / 10 ACTIVE</span>
        </div>
        <p className="text-[10px] text-[var(--text-muted)] leading-tight">
          GWO, WOA, ALO, MFO, GOA, MVO, SCA, AOA, MGO, GMO
        </p>
      </div>
    </aside>
  );
};
