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
    { id: 'results', label: 'Benchmark Results', icon: BarChart3, badge: completedExperimentsCount > 0 ? String(completedExperimentsCount) : undefined },
    { id: 'pareto', label: 'Pareto Front', icon: GitFork },
    { id: 'convergence', label: 'Convergence Curves', icon: TrendingDown },
    { id: 'statistics', label: 'Multi-Run Statistics', icon: Layers },
    { id: 'ablation', label: 'Ablation Study', icon: Layers2 },
    { id: 'history', label: 'Experiment History', icon: History },
    { id: 'hardware', label: 'Hardware Telemetry', icon: Cpu },
    { id: 'documentation', label: '10 Optimizers & Docs', icon: BookOpen },
    { id: 'reports', label: 'Research Reports', icon: FileText },
  ];

  return (
    <aside className="w-60 bg-[#0e1422] border-r border-slate-800/80 flex flex-col justify-between h-[calc(100vh-3.5rem)] sticky top-14 select-none">
      <div className="py-3 px-2">
        <div className="px-3 py-1 mb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom info panel */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/40 text-[11px] text-slate-400">
        <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 mb-1">
          <span>ALGORITHMS</span>
          <span className="text-emerald-400 font-bold">10 / 10 LOADED</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          GWO, WOA, ALO, MFO, GOA, MVO, SCA, AOA, MGO, GMO
        </p>
      </div>
    </aside>
  );
};
