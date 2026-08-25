import React from 'react';
import { FileText, Download, FileSpreadsheet, Code, ShieldAlert } from 'lucide-react';
import { Experiment } from '../../types';
import { api } from '../../services/api';

interface ReportsViewProps {
  experiment: Experiment;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ experiment }) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            RESEARCH REPORT EXPORT CENTER &bull; {experiment.id}
          </h2>
          <p className="text-xs text-slate-400">
            Export experimental benchmarks in publication-ready formats with full provenance audit trail.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Markdown Report Card */}
        <div className="lab-card p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Scientific Markdown Report</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete research paper style markdown report with methodology, baseline comparisons, rankings, winner rationale, and disclosures.
            </p>
          </div>
          <a
            href={api.getExportUrl(experiment.id, 'markdown')}
            download
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded transition"
          >
            <Download className="w-4 h-4" />
            <span>Download .MD Report</span>
          </a>
        </div>

        {/* CSV Data Card */}
        <div className="lab-card p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Raw Results CSV Data</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tabular spreadsheet of all 10 algorithms, accuracy, latency, size, energy, FLOPs, parameters, and Pareto classification.
            </p>
          </div>
          <a
            href={api.getExportUrl(experiment.id, 'csv')}
            download
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded transition"
          >
            <Download className="w-4 h-4" />
            <span>Download .CSV Spreadsheet</span>
          </a>
        </div>

        {/* Raw JSON Card */}
        <div className="lab-card p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
              <Code className="w-4 h-4 text-purple-400" />
              <span>Complete JSON Payload</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Machine-readable structured JSON document containing full experiment configuration, all individual run logs, convergence curves, and hardware telemetry.
            </p>
          </div>
          <a
            href={api.getExportUrl(experiment.id, 'json')}
            download
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs rounded transition"
          >
            <Download className="w-4 h-4" />
            <span>Download .JSON Data</span>
          </a>
        </div>
      </div>

      {/* Research Disclosures & Scientific Limitations */}
      <div className="lab-card p-5 space-y-3">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          Mandatory Research Limitations &amp; Disclosures
        </h4>
        <div className="space-y-2 text-xs text-slate-300 leading-relaxed font-sans">
          <p>
            1. <strong>Hardware Scope</strong>: Latency (ms) and Energy (J) are measured on the tested host device ({experiment.hardware?.device_name || 'System GPU/CPU'}). Results may vary on edge microcontrollers or differing GPU microarchitectures.
          </p>
          <p>
            2. <strong>Objective Weight Sensitivity</strong>: Ranked winners depend strictly on the selected multi-objective weights (Accuracy {(experiment.weight_accuracy*100).toFixed(0)}%, Latency {(experiment.weight_latency*100).toFixed(0)}%, Size {(experiment.weight_model_size*100).toFixed(0)}%, Energy {(experiment.weight_energy*100).toFixed(0)}%). There is no single universally optimal metaheuristic for all engineering trade-offs.
          </p>
          <p>
            3. <strong>Stochastic Evaluation</strong>: Due to the stochastic nature of metaheuristics, results are averaged across {experiment.number_of_runs} independent runs under reproducible seed policy.
          </p>
        </div>
      </div>
    </div>
  );
};
