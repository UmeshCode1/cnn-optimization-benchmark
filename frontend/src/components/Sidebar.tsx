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
  Database,
  SlidersHorizontal,
  X,
  Sparkles,
  FlaskConical,
  CheckCircle2,
  Activity,
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
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  completedExperimentsCount,
  activeExperimentId,
  isOpenMobile = false,
  onCloseMobile = () => {},
}) => {
  const navGroups = [
    {
      title: 'RESEARCH',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'wizard', label: 'New Benchmark', icon: PlayCircle },
        { id: 'results', label: 'Benchmark Results', icon: BarChart3, badge: completedExperimentsCount > 0 ? String(completedExperimentsCount) : undefined },
        { id: 'history', label: 'Experiment Archive', icon: History },
      ],
    },
    {
      title: 'ANALYSIS',
      items: [
        { id: 'pareto', label: 'Pareto Front', icon: GitFork },
        { id: 'convergence', label: 'Convergence Curves', icon: TrendingDown },
        { id: 'statistics', label: 'Multi-Run Statistics', icon: Layers2 },
        { id: 'ablation', label: 'Ablation Study', icon: SlidersHorizontal },
      ],
    },
    {
      title: 'RESOURCES',
      items: [
        { id: 'datasets', label: 'Dataset Repository', icon: Database },
        { id: 'hardware', label: 'Hardware Telemetry', icon: Cpu },
        { id: 'documentation', label: 'Algorithm Docs & Guide', icon: BookOpen },
        { id: 'reports', label: 'Export & Reports', icon: FileText },
      ],
    },
  ];

  const handleSelectTab = (tabId: NavTab) => {
    setActiveTab(tabId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Container (Desktop Sticky + Mobile Off-canvas Drawer) */}
      <aside
        className={`w-60 ws-sidebar flex flex-col justify-between select-none shrink-0 transition-transform duration-200 z-50 ${
          isOpenMobile
            ? 'fixed inset-y-0 left-0 top-0 h-full shadow-2xl translate-x-0'
            : 'hidden md:flex md:h-[calc(100vh-3.5rem)] md:sticky md:top-14 -translate-x-full md:translate-x-0'
        }`}
      >
        {/* Mobile Header with Close Button */}
        <div className="p-3 border-b border-[var(--border)] flex items-center justify-between md:hidden">
          <div className="flex items-center gap-2 font-semibold text-xs text-[var(--text-primary)]">
            <div className="w-7 h-7 rounded-lg overflow-hidden border border-[var(--border)] bg-[#0b0f19] flex items-center justify-center">
              <img src="/logo.svg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span>Benchmark Platform</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav Links */}
        <div className="py-3 px-2 space-y-4 overflow-y-auto flex-1">
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
                      onClick={() => handleSelectTab(item.id as NavTab)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[var(--surface-elevated)] text-[var(--accent)] font-semibold border-l-2 border-[var(--accent)] rounded-l-none shadow-xs'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)] font-semibold">
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

        {/* Scientific Laboratory Telemetry Card Footer */}
        <div className="p-3 border-t border-[var(--border)] bg-[var(--surface-secondary)]/50 backdrop-blur-xs space-y-2">
          {/* Active Experiment Capsule */}
          <div
            onClick={() => handleSelectTab('results')}
            className="p-2 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] hover:border-[var(--accent)] transition-all cursor-pointer space-y-1 shadow-xs group"
            title="Click to view Active Benchmark Results"
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <FlaskConical className="w-3 h-3 text-[var(--accent)] group-hover:rotate-12 transition-transform" />
                <span className="font-semibold uppercase tracking-wider">Active Run</span>
              </span>
              <span className="flex items-center gap-1 text-[var(--success)] font-medium text-[9px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                <span>ONLINE</span>
              </span>
            </div>
            <div className="font-mono text-xs font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">
              {activeExperimentId || 'EXP-20260826-0001'}
            </div>
          </div>

          {/* System Status Row */}
          <div className="flex items-center justify-between text-[11px] font-mono px-1">
            <span className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3 h-3 text-[var(--success)]" />
              <span>Optimizers:</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--success)] px-1.5 py-0.2 rounded bg-[var(--success)]/10 border border-[var(--success)]/20">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>10 / 10 Ready</span>
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
