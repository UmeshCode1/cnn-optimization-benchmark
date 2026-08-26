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
  activeExperimentId?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  completedExperimentsCount,
  activeExperimentId,
}) => {
  const navGroups = [
    {
      title: 'RESEARCH',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'wizard', label: 'New Benchmark', icon: PlayCircle },
        { id: 'results', label: 'Benchmark Results', icon: BarChart3, badge: completedExperimentsCount > 0 ? String(completedExperimentsCount) : undefined },
        { id: 'history', label: 'Experiment History', icon: History },
      ],
    },
    {
      title: 'ANALYSIS',
      items: [
        { id: 'pareto', label: 'Pareto Front', icon: GitFork },
        { id: 'convergence', label: 'Convergence Curves', icon: TrendingDown },
        { id: 'statistics', label: 'Multi-Run Statistics', icon: Layers2 },
        { id: 'ablation', label: 'Ablation Study', icon: Layers },
      ],
    },
    {
      title: 'RESOURCES',
      items: [
        { id: 'datasets', label: 'Dataset Repository', icon: Layers },
        { id: 'hardware', label: 'Hardware Telemetry', icon: Cpu },
        { id: 'documentation', label: 'Optimizers & Docs', icon: BookOpen },
        { id: 'reports', label: 'Research Reports', icon: FileText },
      ],
    },
  ];

  return (
    <aside className="w-56 ws-sidebar flex flex-col justify-between h-[calc(100vh-3.5rem)] sticky top-14 select-none shrink-0">
      <div className="py-3 px-2 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {group.title}
            </div>
            <nav className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as NavTab)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--surface-elevated)] text-[var(--accent)] font-semibold border-l-2 border-[var(--accent)] rounded-l-none'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Compact Research Footer */}
      <div className="p-3 border-t border-[var(--border)] bg-[var(--surface)] text-[11px] text-[var(--text-muted)] font-mono space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span>ACTIVE EXP:</span>
          <span className="font-semibold text-[var(--text-primary)]">{activeExperimentId || 'NONE'}</span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span>OPTIMIZERS:</span>
          <span className="text-[var(--success)] font-medium">10 / 10 LOADED</span>
        </div>
      </div>
    </aside>
  );
};
