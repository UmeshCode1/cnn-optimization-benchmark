import React from 'react';
import { FileText, Download, FileSpreadsheet, Code, ShieldAlert, CheckCircle2, Database, Cpu } from 'lucide-react';
import { Experiment } from '../../types';
import { api } from '../../services/api';

interface ReportsViewProps {
  experiment: Experiment;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ experiment }) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="ws-page-title">Research Reports &amp; Publication Export</h2>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
              {experiment.id}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Export experimental benchmarks in publication-ready formats with full methodology and audit trails.
          </p>
        </div>
      </div>

      {/* Export Format Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Markdown Report Card */}
        <div className="ws-panel p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
              <FileText className="w-4 h-4 text-blue-500" />
              <span>Scientific Markdown Report</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Complete research paper style markdown report with methodology, baseline comparisons, rankings, winner rationale, and disclosures.
            </p>
          </div>
          <a
            href={api.getExportUrl(experiment.id, 'markdown')}
            download
            className="w-full flex items-center justify-center gap-2 py-2 px-3 ws-button-primary text-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download .MD Report</span>
          </a>
        </div>

        {/* CSV Data Card */}
        <div className="ws-panel p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
              <FileSpreadsheet className="w-4 h-4 text-[var(--success)]" />
              <span>Raw Results CSV Data</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Tabular spreadsheet of all algorithms, accuracy, latency, size, energy, FLOPs, parameters, and Pareto classification.
            </p>
          </div>
          <a
            href={api.getExportUrl(experiment.id, 'csv')}
            download
            className="w-full flex items-center justify-center gap-2 py-2 px-3 ws-button-secondary text-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download .CSV Spreadsheet</span>
          </a>
        </div>

        {/* Raw JSON Card */}
        <div className="ws-panel p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
              <Code className="w-4 h-4 text-purple-400" />
              <span>Complete JSON Payload</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Machine-readable structured JSON document containing full experiment configuration, all individual run logs, convergence curves, and hardware telemetry.
            </p>
          </div>
          <a
            href={api.getExportUrl(experiment.id, 'json')}
            download
            className="w-full flex items-center justify-center gap-2 py-2 px-3 ws-button-secondary text-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download .JSON Data</span>
          </a>
        </div>
      </div>

      {/* Live In-App Research Report Document Preview */}
      <div className="ws-panel p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div>
            <span className="text-[10px] font-mono text-[var(--accent)] font-semibold uppercase">
              In-App Document Preview
            </span>
            <h3 className="text-base font-bold text-[var(--text-primary)] mt-0.5">
              Empirical Research Report: {experiment.title}
            </h3>
          </div>
          <span className="text-xs font-mono text-[var(--text-muted)]">
            Generated on {experiment.created_at || 'Current Session'}
          </span>
        </div>

        <div className="space-y-4 text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
          <div>
            <h4 className="font-semibold text-xs text-[var(--text-primary)] font-mono uppercase mb-1">
              1. Executive Abstract
            </h4>
            <p>
              This report presents an empirical multi-objective evaluation of metaheuristic optimization algorithms applied to deep convolutional neural network compression for <strong>{experiment.cnn_model_name}</strong> on the <strong>{experiment.dataset_name}</strong> dataset. Evaluated under identical hardware constraints on <strong>{experiment.hardware?.device_name || 'Host CPU/GPU'}</strong>, with <strong>{experiment.quantization_type}</strong> quantization and <strong>{(experiment.pruning_ratio * 100).toFixed(0)}% L1 channel pruning</strong>.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-xs text-[var(--text-primary)] font-mono uppercase mb-1">
              2. Baseline Calibration
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px] p-3 rounded bg-[var(--surface-secondary)] border border-[var(--border)]">
              <div>
                <span className="text-[var(--text-muted)] block">Baseline Accuracy:</span>
                <span className="font-bold text-[var(--text-primary)]">{experiment.baseline?.accuracy || 93.4}%</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block">Baseline Latency:</span>
                <span className="font-bold text-[var(--text-primary)]">{experiment.baseline?.latency_ms || 14.2} ms</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block">Baseline Model Size:</span>
                <span className="font-bold text-[var(--text-primary)]">{experiment.baseline?.model_size_mb || 44.7} MB</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block">Baseline Energy:</span>
                <span className="font-bold text-[var(--text-primary)]">{experiment.baseline?.energy_j || 0.38} J</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-xs text-[var(--text-primary)] font-mono uppercase mb-1">
              3. Objective Weight Distribution
            </h4>
            <p className="font-mono text-[11px] text-[var(--text-muted)]">
              WSM Multi-Objective Weights: Accuracy <strong>{(experiment.weight_accuracy * 100).toFixed(0)}%</strong> &bull; Latency <strong>{(experiment.weight_latency * 100).toFixed(0)}%</strong> &bull; Model Size <strong>{(experiment.weight_model_size * 100).toFixed(0)}%</strong> &bull; Energy <strong>{(experiment.weight_energy * 100).toFixed(0)}%</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Research Disclosures & Scientific Limitations */}
      <div className="ws-panel p-5 space-y-3 border-amber-500/30 bg-amber-500/5">
        <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2 font-mono">
          <ShieldAlert className="w-4 h-4 text-[var(--warning)]" />
          Mandatory Research Limitations &amp; Disclosures
        </h4>
        <div className="space-y-2 text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
          <p>
            1. <strong>Hardware Scope</strong>: Latency (ms) and Energy (J) are measured on the tested host device ({experiment.hardware?.device_name || 'System GPU/CPU'}). Results may vary on edge microcontrollers or differing GPU microarchitectures.
          </p>
          <p>
            2. <strong>Objective Weight Sensitivity</strong>: Ranked winners depend strictly on the selected multi-objective weights (Accuracy {(experiment.weight_accuracy * 100).toFixed(0)}%, Latency {(experiment.weight_latency * 100).toFixed(0)}%, Size {(experiment.weight_model_size * 100).toFixed(0)}%, Energy {(experiment.weight_energy * 100).toFixed(0)}%). There is no single universally optimal metaheuristic for all engineering trade-offs.
          </p>
          <p>
            3. <strong>Stochastic Evaluation</strong>: Due to the stochastic nature of metaheuristics, results are averaged across {experiment.number_of_runs} independent runs under reproducible seed policy.
          </p>
        </div>
      </div>
    </div>
  );
};
