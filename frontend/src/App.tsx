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
import { LiveRunModal } from './components/views/LiveRunModal';
import { api } from './services/api';
import { Experiment, RankedAlgorithm, ParetoPoint, AlgorithmStats, AblationRecord, HardwareProfile } from './types';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('cnn_benchmark_theme');
    return saved === 'light' ? 'light' : 'dark';
  });
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

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
        const details = await api.getExperimentDetails(targetId);
        setExperimentDetails(details);
      }
    } catch (err) {
      console.error('Error loading benchmark data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectExperiment = async (expId: string) => {
    try {
      setActiveExperimentId(expId);
      const details = await api.getExperimentDetails(expId);
      setExperimentDetails(details);
      setActiveTab('results');
    } catch (err) {
      console.error('Failed to load experiment:', err);
    }
  };

  const handleStartBenchmark = async (config: any) => {
    try {
      const created = await api.createExperiment(config, true);
      setRunningExperimentId(created.id);
      setActiveExperimentId(created.id);
    } catch (err: any) {
      alert(`Benchmark launch failed: ${err.message}`);
    }
  };

  const handleRecalculateWeights = async (weights: any, statMode: string) => {
    if (!activeExperimentId) return;
    try {
      const res = await api.recalculateWeights(activeExperimentId, weights, statMode);
      if (experimentDetails) {
        setExperimentDetails({
          ...experimentDetails,
          ranked_algorithms: res.ranked_algorithms,
          experiment: {
            ...experimentDetails.experiment,
            best_algorithm: res.winner_info.best_overall?.algorithm,
            best_algorithm_reason: res.winner_info.rationale,
          },
        });
      }
    } catch (err) {
      console.error('Failed to recalculate weights:', err);
    }
  };

  const handleCompareSelected = async (selectedAlgs: string[]) => {
    if (!activeExperimentId) return;
    try {
      const res = await api.compareSelected(activeExperimentId, selectedAlgs, 'MEAN');
      if (experimentDetails) {
        setExperimentDetails({
          ...experimentDetails,
          ranked_algorithms: res.ranked_algorithms,
          pareto_points: res.pareto_points,
        });
        setActiveTab('results');
      }
    } catch (err) {
      console.error('Failed to compare selected:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)] selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
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
      />

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          completedExperimentsCount={experiments.filter((e) => e.status === 'COMPLETED').length}
          activeExperimentId={experimentDetails?.experiment?.id}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
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
            <div className="space-y-4 max-w-7xl mx-auto">
              <h2 className="text-lg font-bold text-slate-100">ALL BENCHMARK EXPERIMENTS</h2>
              <div className="lab-card p-4">
                <table className="lab-table font-mono text-xs">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Dataset / CNN</th>
                      <th>Status</th>
                      <th>Best Algorithm</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {experiments.map((exp) => (
                      <tr key={exp.id}>
                        <td className="text-blue-400 font-bold">{exp.id}</td>
                        <td className="text-slate-200">{exp.title}</td>
                        <td className="text-slate-300">{exp.dataset_name} &bull; {exp.cnn_model_name}</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            exp.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {exp.status}
                          </span>
                        </td>
                        <td className="text-emerald-400 font-bold">{exp.best_algorithm || '--'}</td>
                        <td>
                          <button
                            onClick={() => handleSelectExperiment(exp.id)}
                            className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-sans font-medium"
                          >
                            Open Results
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
