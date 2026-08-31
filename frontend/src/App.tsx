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
import { ConfusionMatrixView } from './components/views/ConfusionMatrixView';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ExecutionModeBanner } from './components/common/ExecutionModeBanner';
import { api } from './services/api';
import {
  Experiment,
  RankedAlgorithm,
  ParetoPoint,
  AlgorithmStats,
  AblationRecord,
  HardwareProfile,
  SystemCapabilities,
} from './types';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('cnn_benchmark_theme');
    return saved === 'light' ? 'light' : 'dark';
  });
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // App Data State
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [capabilities, setCapabilities] = useState<SystemCapabilities | undefined>(undefined);
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
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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
      setLoadError(null);
      const [exps, hw, caps] = await Promise.all([
        api.listExperiments(),
        api.getHardwareProfile().catch(() => undefined),
        api.getCapabilities().catch(() => undefined),
      ]);
      setExperiments(exps);
      setHardware(hw);
      setCapabilities(caps);

      if (exps.length > 0) {
        const validActive = exps.find((e) => e.id === activeExperimentId);
        const targetId = validActive ? validActive.id : exps[0].id;
        setActiveExperimentId(targetId);
        await loadExperimentDetails(targetId);
      } else {
        setActiveExperimentId(null);
        setExperimentDetails(null);
      }
    } catch (err: any) {
      console.error('Failed to load benchmark data:', err);
      setLoadError(err?.message || 'Failed to connect to the benchmark API. The backend may be starting up — please wait a moment and refresh.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadExperimentDetails = async (expId: string) => {
    try {
      setIsLoadingDetails(true);
      const details = await api.getExperiment(expId);
      setExperimentDetails(details);
    } catch (err) {
      console.error(`Failed to load experiment ${expId}:`, err);
      setExperimentDetails(null);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectExperiment = async (expId: string) => {
    setActiveExperimentId(expId);
    await loadExperimentDetails(expId);
    // If user is on dashboard, wizard, or history, open results view
    if (['dashboard', 'wizard', 'history'].includes(activeTab)) {
      setActiveTab('results');
    }
  };

  const handleStartBenchmark = async (config: any) => {
    try {
      const created = await api.createExperiment(config);
      setRunningExperimentId(created.id);
      setActiveExperimentId(created.id);
      setExperiments((prev) => [created, ...prev.filter((e) => e.id !== created.id)]);
      setActiveTab('dashboard');
    } catch (err: any) {
      console.error('Failed to launch benchmark:', err);
      alert(`Failed to launch benchmark: ${err.message || 'Unknown error'}`);
    }
  };

  const handleRecalculateWeights = async (
    weights: {
      accuracy: number;
      latency: number;
      model_size: number;
      energy: number;
    },
    statMode: string = 'MEAN'
  ) => {
    if (!activeExperimentId) return;
    try {
      const updated = await api.recalculateScores(activeExperimentId, weights, statMode);
      setExperimentDetails(updated);
    } catch (err) {
      console.error('Failed to recalculate weights:', err);
    }
  };

  const handleCompareSelected = (_algs: string[]) => {
    setActiveTab('results');
  };

  const isAnalysisTab = ['results', 'pareto', 'convergence', 'statistics', 'confusion', 'ablation', 'reports'].includes(activeTab);

  // ── Global Loading Screen ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex flex-col items-center justify-center gap-4 font-mono text-xs">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
        <div className="text-center space-y-1">
          <p className="text-[var(--text-primary)] font-semibold">Initializing Benchmark Platform...</p>
          <p className="text-[var(--text-muted)]">Connecting to backend API & loading experiment data</p>
        </div>
      </div>
    );
  }

  // ── Global Error Screen ────────────────────────────────────────────────────
  if (loadError && experiments.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex flex-col items-center justify-center gap-4 p-8">
        <div className="ws-panel p-8 max-w-md w-full space-y-4 text-center border-[var(--danger)]/30">
          <div className="w-12 h-12 rounded-full bg-[var(--danger)]/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-[var(--danger)]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Backend Connection Failed</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{loadError}</p>
          </div>
          <button
            onClick={() => loadData()}
            className="flex items-center gap-1.5 px-4 py-2 ws-button-primary text-xs mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex flex-col font-sans selection:bg-[var(--accent)] selection:text-white">
      {/* Top Navigation Control Bar */}
      <Navbar
        hardware={hardware}
        activeExperiment={experimentDetails?.experiment || experiments.find((e) => e.id === activeExperimentId)}
        experiments={experiments}
        onSelectExperiment={handleSelectExperiment}
        theme={theme}
        toggleTheme={toggleTheme}
        onNewBenchmark={() => setActiveTab('wizard')}
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Execution Mode & Provenance Banner */}
      <ExecutionModeBanner
        experiment={experimentDetails?.experiment || experiments.find((e) => e.id === activeExperimentId)}
        capabilities={capabilities}
      />

      <div className="flex flex-1 relative">
        {/* Responsive Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          completedExperimentsCount={experiments.filter((e) => e.status === 'COMPLETED').length}
          activeExperimentId={experimentDetails?.experiment?.id || activeExperimentId}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto max-h-[calc(100vh-3.5rem)] animate-fade-in w-full">
          <ErrorBoundary>
            {activeTab === 'dashboard' && (
              <DashboardView
                experiments={experiments}
                latestExperiment={experimentDetails?.experiment || experiments[0]}
                rankedAlgorithms={experimentDetails?.ranked_algorithms || []}
                paretoPoints={experimentDetails?.pareto_points || []}
                onNewBenchmark={() => setActiveTab('wizard')}
                onOpenExperiment={handleSelectExperiment}
                onViewResults={() => setActiveTab('results')}
              />
            )}
          </ErrorBoundary>

          <ErrorBoundary>
            {activeTab === 'wizard' && (
              <NewBenchmarkWizard
                hardware={hardware}
                onSubmitBenchmark={handleStartBenchmark}
                onCancel={() => setActiveTab('dashboard')}
              />
            )}
          </ErrorBoundary>

          <ErrorBoundary>
            {activeTab === 'datasets' && (
              <DatasetsView
                onSelectDatasetForBenchmark={() => {
                  setActiveTab('wizard');
                }}
              />
            )}
          </ErrorBoundary>

          {/* Analysis Views Loading State */}
          {isAnalysisTab && isLoadingDetails && (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-xs font-mono text-[var(--text-muted)] space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
              <span>Loading benchmark experiment data ({activeExperimentId || 'EXP'})...</span>
            </div>
          )}

          {/* Analysis Views Empty State */}
          {isAnalysisTab && !isLoadingDetails && !experimentDetails && (
            <div className="ws-panel p-8 text-center max-w-lg mx-auto mt-12 space-y-4">
              <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center mx-auto text-xl">
                📊
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">No Benchmark Selected</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {experiments.length > 0
                  ? 'Select an experiment from the active switcher in the navbar or pick one below to view detailed analytics.'
                  : 'No benchmarks found. Launch a new benchmark to evaluate metaheuristic optimization on CNNs.'}
              </p>
              {experiments.length > 0 ? (
                <div className="pt-2 space-y-2">
                  <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                    Quick Select:
                  </div>
                  <div className="flex flex-col gap-2">
                    {experiments.slice(0, 3).map((exp) => (
                      <button
                        key={exp.id}
                        onClick={() => handleSelectExperiment(exp.id)}
                        className="p-2.5 rounded bg-[var(--surface-secondary)] hover:bg-[var(--surface-elevated)] text-left flex items-center justify-between border border-[var(--border)] text-xs font-mono cursor-pointer transition-colors"
                      >
                        <span className="font-bold text-[var(--accent)]">{exp.id}</span>
                        <span className="text-[var(--text-secondary)] font-sans text-[11px]">
                          {exp.dataset_name} &bull; {exp.cnn_model_name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab('wizard')}
                  className="px-4 py-2 ws-button-primary text-xs"
                >
                  Start New Benchmark
                </button>
              )}
            </div>
          )}

          {/* Active Analysis Views */}
          {!isLoadingDetails && experimentDetails && (
            <>
              <ErrorBoundary>
                {activeTab === 'results' && (
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
                    onViewConfusion={() => setActiveTab('confusion')}
                  />
                )}
              </ErrorBoundary>

              <ErrorBoundary>
                {activeTab === 'pareto' && (
                  <ParetoExplorerView
                    experiment={experimentDetails.experiment}
                    paretoPoints={experimentDetails.pareto_points}
                  />
                )}
              </ErrorBoundary>

              <ErrorBoundary>
                {activeTab === 'convergence' && (
                  <ConvergenceView
                    experiment={experimentDetails.experiment}
                    runs={experimentDetails.runs}
                  />
                )}
              </ErrorBoundary>

              <ErrorBoundary>
                {activeTab === 'statistics' && (
                  <MultiRunStatsView
                    experiment={experimentDetails.experiment}
                    statistics={experimentDetails.statistics_by_algorithm}
                  />
                )}
              </ErrorBoundary>

              <ErrorBoundary>
                {activeTab === 'confusion' && (
                  <ConfusionMatrixView
                    experiment={experimentDetails.experiment}
                  />
                )}
              </ErrorBoundary>

              <ErrorBoundary>
                {activeTab === 'ablation' && (
                  <AblationView
                    experiment={experimentDetails.experiment}
                    ablations={experimentDetails.ablations}
                  />
                )}
              </ErrorBoundary>

              <ErrorBoundary>
                {activeTab === 'reports' && (
                  <ReportsView experiment={experimentDetails.experiment} />
                )}
              </ErrorBoundary>
            </>
          )}

          <ErrorBoundary>
            {activeTab === 'hardware' && (
              <HardwareView hardware={hardware} />
            )}
          </ErrorBoundary>

          <ErrorBoundary>
            {activeTab === 'documentation' && (
              <DocumentationView />
            )}
          </ErrorBoundary>

          <ErrorBoundary>
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
          </ErrorBoundary>
        </main>
      </div>

      {/* Live Run Modal Overlay */}
      {runningExperimentId && (
        <LiveRunModal
          experimentId={runningExperimentId}
          onClose={async () => {
            const expId = runningExperimentId;
            setRunningExperimentId(null);
            await loadData();
            if (expId) {
              await loadExperimentDetails(expId);
            }
          }}
          onCompleted={async () => {
            const expId = runningExperimentId;
            setRunningExperimentId(null);
            await loadData();
            if (expId) {
              setActiveExperimentId(expId);
              await loadExperimentDetails(expId);
            }
            setActiveTab('results');
          }}
        />
      )}
    </div>
  );
};
export default App;
