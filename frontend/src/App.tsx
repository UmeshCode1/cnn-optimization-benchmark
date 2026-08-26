import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/views/DashboardView';
import { NewBenchmarkWizard } from './components/views/NewBenchmarkWizard';
import { ComparisonDashboardView } from './components/views/ComparisonDashboardView';
import { ParetoExplorerView } from './components/views/ParetoExplorerView';
import { ConvergenceView } from './components/views/ConvergenceView';
import { MultiRunStatsView } from './components/views/MultiRunStatsView';
import { AblationView } from './components/views/AblationView';
import { HardwareView } from './components/views/HardwareView';
import { DocumentationView } from './components/views/DocumentationView';
import { ReportsView } from './components/views/ReportsView';
import { DatasetsView } from './components/views/DatasetsView';
import { HistoryView } from './components/views/HistoryView';
import { LiveRunModal } from './components/views/LiveRunModal';
import { api } from './services/api';
import { Experiment, RankedAlgorithm, ParetoPoint, AlgorithmStats, AblationRecord, HardwareProfile } from './types';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('cnn_benchmark_theme');
    return saved === 'light' ? 'light' : 'dark';
  });
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // App Data State
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [activeExperimentId, setActiveExperimentId] = useState<string | null>(null);
  const [experimentDetails, setExperimentDetails] = useState<{
    experiment: Experiment;
    runs: any[];
    statistics_by_algorithm: Record<string, AlgorithmStats>;
    ranked_algorithms: RankedAlgorithm[];
    pareto_points: ParetoPoint[];
    ablations: AblationRecord[];
  } | null>(null);

  const [hardware, setHardware] = useState<HardwareProfile | undefined>(undefined);
  const [runningExperimentId, setRunningExperimentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.classList.remove('light-theme');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('cnn_benchmark_theme', next);
  };

  const loadData = async (isManualRefresh: boolean = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      const [exps, hw] = await Promise.all([
        api.listExperiments(),
        api.getHardwareProfile().catch(() => undefined),
      ]);
      setExperiments(exps);
      setHardware(hw);

      if (exps.length > 0) {
        const targetId = activeExperimentId || exps[0].id;
        setActiveExperimentId(targetId);
        await loadExperimentDetails(targetId);
      }
    } catch (err) {
      console.error('Failed to load benchmark data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadExperimentDetails = async (expId: string) => {
    try {
      const details = await api.getExperiment(expId);
      setExperimentDetails(details);
    } catch (err) {
      console.error(`Failed to load experiment ${expId}:`, err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectExperiment = async (expId: string) => {
    setActiveExperimentId(expId);
    await loadExperimentDetails(expId);
  };

  const handleStartBenchmark = async (config: any) => {
    try {
      const created = await api.createExperiment(config);
      setRunningExperimentId(created.id);
      setActiveExperimentId(created.id);
      setActiveTab('dashboard');
    } catch (err) {
      console.error('Failed to launch benchmark:', err);
    }
  };

  const handleRecalculateWeights = async (weights: {
    accuracy: number;
    latency: number;
    model_size: number;
    energy: number;
  }) => {
    if (!activeExperimentId) return;
    try {
      const updated = await api.recalculateScores(activeExperimentId, weights);
      setExperimentDetails(updated);
    } catch (err) {
      console.error('Failed to recalculate weights:', err);
    }
  };

  const handleCompareSelected = (algs: string[]) => {
    setActiveTab('results');
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex flex-col font-sans selection:bg-[var(--accent)] selection:text-white">
      {/* Top Navigation Control Bar */}
      <Navbar
        hardware={hardware}
        activeExperiment={experimentDetails?.experiment}
        experiments={experiments}
        onSelectExperiment={handleSelectExperiment}
        theme={theme}
        toggleTheme={toggleTheme}
        onNewBenchmark={() => setActiveTab('wizard')}
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      <div className="flex flex-1 relative">
        {/* Responsive Sidebar (Sticky on Desktop, Off-Canvas Drawer on Mobile) */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          completedExperimentsCount={experiments.filter((e) => e.status === 'COMPLETED').length}
          activeExperimentId={experimentDetails?.experiment?.id}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto max-h-[calc(100vh-3.5rem)] animate-fade-in w-full">
          {activeTab === 'dashboard' && (
            <DashboardView
              experiments={experiments}
              latestExperiment={experimentDetails?.experiment}
              rankedAlgorithms={experimentDetails?.ranked_algorithms || []}
              paretoPoints={experimentDetails?.pareto_points || []}
              onNewBenchmark={() => setActiveTab('wizard')}
              onOpenExperiment={handleSelectExperiment}
              onViewResults={() => setActiveTab('results')}
            />
          )}

          {activeTab === 'wizard' && (
            <NewBenchmarkWizard
              hardware={hardware}
              onSubmitBenchmark={handleStartBenchmark}
              onCancel={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'datasets' && (
            <DatasetsView
              onSelectDatasetForBenchmark={() => {
                setActiveTab('wizard');
              }}
            />
          )}

          {activeTab === 'results' && experimentDetails && (
            <ComparisonDashboardView
              experiment={experimentDetails.experiment}
              rankedAlgorithms={experimentDetails.ranked_algorithms}
              statistics={experimentDetails.statistics_by_algorithm}
              paretoPoints={experimentDetails.pareto_points}
              onRecalculateWeights={handleRecalculateWeights}
              onCompareSelected={handleCompareSelected}
              onViewPareto={() => setActiveTab('pareto')}
              onViewConvergence={() => setActiveTab('convergence')}
              onViewStatistics={() => setActiveTab('statistics')}
            />
          )}

          {activeTab === 'pareto' && experimentDetails && (
            <ParetoExplorerView
              experiment={experimentDetails.experiment}
              paretoPoints={experimentDetails.pareto_points}
            />
          )}

          {activeTab === 'convergence' && experimentDetails && (
            <ConvergenceView
              experiment={experimentDetails.experiment}
              runs={experimentDetails.runs}
            />
          )}

          {activeTab === 'statistics' && experimentDetails && (
            <MultiRunStatsView
              experiment={experimentDetails.experiment}
              statistics={experimentDetails.statistics_by_algorithm}
            />
          )}

          {activeTab === 'ablation' && experimentDetails && (
            <AblationView
              experiment={experimentDetails.experiment}
              ablations={experimentDetails.ablations}
            />
          )}

          {activeTab === 'hardware' && (
            <HardwareView hardware={hardware} />
          )}

          {activeTab === 'documentation' && (
            <DocumentationView />
          )}

          {activeTab === 'reports' && experimentDetails && (
            <ReportsView experiment={experimentDetails.experiment} />
          )}

          {activeTab === 'history' && (
            <HistoryView
              experiments={experiments}
              activeExperimentId={activeExperimentId || undefined}
              onSelectExperiment={(id) => {
                handleSelectExperiment(id);
                setActiveTab('results');
              }}
              onNewBenchmark={() => setActiveTab('wizard')}
            />
          )}
        </main>
      </div>

      {/* Live Run Modal Overlay */}
      {runningExperimentId && (
        <LiveRunModal
          experimentId={runningExperimentId}
          onClose={() => setRunningExperimentId(null)}
          onCompleted={() => {
            setRunningExperimentId(null);
            loadData();
            setActiveTab('results');
          }}
        />
      )}
    </div>
  );
};
export default App;
