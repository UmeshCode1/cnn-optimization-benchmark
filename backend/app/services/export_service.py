"""
Export Service for Research Reports, CSV, JSON, Markdown, Plain Text (TXT), and Microsoft Word DOCS (.doc).
"""

import json
import io
import csv
from typing import Dict, Any, List


class ExportService:
    """Exports benchmark data and platform documentation into multiple scientific formats."""

    @staticmethod
    def generate_csv(experiment_data: Dict[str, Any], ranked_runs: List[Dict[str, Any]]) -> str:
        """Export comprehensive comparison table to CSV."""
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header metadata
        writer.writerow(["# Experiment ID", experiment_data.get("id")])
        writer.writerow(["# Title", experiment_data.get("title")])
        writer.writerow(["# Dataset", experiment_data.get("dataset_name")])
        writer.writerow(["# CNN Model", experiment_data.get("cnn_model_name")])
        writer.writerow(["# Quantization", experiment_data.get("quantization_type")])
        writer.writerow(["# Pruning", f"{experiment_data.get('pruning_method')} ({experiment_data.get('pruning_ratio', 0)*100:.0f}%)"])
        writer.writerow(["# Runs Evaluated", experiment_data.get("number_of_runs")])
        writer.writerow(["# Provenance Status", "DEMO DATA" if experiment_data.get("is_demo") else "MEASURED_EXPERIMENTAL"])
        writer.writerow([])

        # Table header
        writer.writerow([
            "Rank",
            "Algorithm",
            "Accuracy (%)",
            "Accuracy Drop (%)",
            "Latency (ms)",
            "Speedup (x)",
            "Model Size (MB)",
            "Compression Ratio",
            "Energy (J)",
            "Parameters (M)",
            "FLOPs (MFLOPs)",
            "Overall Score (/100)",
            "Pareto Optimal",
        ])

        pareto_algs = set(experiment_data.get("pareto_optimal_algorithms", []))

        for r in ranked_runs:
            alg = r.get("algorithm")
            is_pareto = "YES" if alg in pareto_algs else "NO"
            writer.writerow([
                r.get("rank", "-"),
                alg,
                f"{r.get('accuracy', 0):.2f}",
                f"{r.get('accuracy_drop', 0):.2f}",
                f"{r.get('latency_ms', 0):.2f}",
                f"{r.get('speedup', 1.0):.2f}",
                f"{r.get('model_size_mb', 0):.2f}",
                f"{r.get('compression_ratio', 1.0):.2f}",
                f"{r.get('energy_j', 0):.4f}",
                f"{r.get('parameters_m', 0):.2f}",
                f"{r.get('flops_m', 0):.1f}",
                f"{r.get('overall_score', 0):.2f}",
                is_pareto,
            ])

        return output.getvalue()

    @staticmethod
    def generate_txt_report(
        experiment_data: Dict[str, Any],
        ranked_runs: List[Dict[str, Any]],
        winners: Dict[str, Any],
        ablations: List[Dict[str, Any]],
    ) -> str:
        """Generate structured Plain Text (TXT) scientific research report with formatted ASCII tables."""
        exp_id = experiment_data.get("id", "EXP-0000")
        title = experiment_data.get("title", "CNN Optimization Benchmark")
        demo_str = "[ CAUTION: DEMO DATA -- NOT EXPERIMENTAL RESULTS ]\n" if experiment_data.get("is_demo") else ""

        sep = "=" * 80
        subsep = "-" * 80

        lines = [
            sep,
            f"CNN OPTIMIZATION BENCHMARK -- SCIENTIFIC RESEARCH REPORT",
            sep,
            demo_str,
            f"EXPERIMENT IDENTIFIER : {exp_id}",
            f"PROJECT / EXPERIMENT  : {title}",
            f"TIMESTAMP GENERATED   : {experiment_data.get('completed_at') or 'Active'}",
            f"DATASET               : {experiment_data.get('dataset_name')} ({experiment_data.get('dataset_split')})",
            f"CNN ARCHITECTURE      : {experiment_data.get('cnn_model_name')} (Checkpoint: {experiment_data.get('checkpoint_name')})",
            f"QUANTIZATION          : {experiment_data.get('quantization_type')}",
            f"PRUNING               : {experiment_data.get('pruning_method')} ({experiment_data.get('pruning_ratio', 0)*100:.0f}% sparsity)",
            f"SEARCH PARAMS         : Population={experiment_data.get('population_size')}, Max Iterations={experiment_data.get('max_iterations')}",
            f"REPETITIONS & SEED    : {experiment_data.get('number_of_runs')} runs, Seed Policy: {experiment_data.get('random_seed_policy')} (Base: {experiment_data.get('base_seed')})",
            f"HARDWARE PLATFORM     : {experiment_data.get('hardware', {}).get('device_name', 'Host System')}",
            subsep,
            "",
            "1. BASELINE ARCHITECTURE MEASUREMENTS",
            subsep,
            f"{'Metric':<25} | {'Baseline Value':<18} | {'Unit':<10} | {'Provenance'}",
            subsep,
            f"{'Top-1 Accuracy':<25} | {experiment_data.get('baseline', {}).get('accuracy', 0):<18.2f} | {'%':<10} | MEASURED",
            f"{'Latency':<25} | {experiment_data.get('baseline', {}).get('latency_ms', 0):<18.2f} | {'ms':<10} | MEASURED",
            f"{'Model Size':<25} | {experiment_data.get('baseline', {}).get('model_size_mb', 0):<18.2f} | {'MB':<10} | MEASURED",
            f"{'Energy per Inference':<25} | {experiment_data.get('baseline', {}).get('energy_j', 0):<18.4f} | {'Joules':<10} | MEASURED/ESTIMATED",
            f"{'Parameters':<25} | {experiment_data.get('baseline', {}).get('parameters_m', 0):<18.2f} | {'Million':<10} | CALCULATED",
            f"{'FLOPs':<25} | {experiment_data.get('baseline', {}).get('flops_m', 0):<18.1f} | {'MFLOPs':<10} | CALCULATED",
            "",
            "2. ALGORITHM COMPARATIVE RANKING MATRIX",
            subsep,
            f"{'Rank':<5} | {'Algorithm':<14} | {'Accuracy':<10} | {'Latency':<10} | {'Size':<10} | {'Energy':<10} | {'Score':<8} | {'Pareto'}",
            subsep,
        ]

        pareto_algs = set(experiment_data.get("pareto_optimal_algorithms", []))
        for r in ranked_runs:
            is_p = "YES" if r.get("algorithm") in pareto_algs else "NO"
            lines.append(
                f"#{r.get('rank', '-'):<4} | {r.get('algorithm', ''):<14} | "
                f"{r.get('accuracy', 0):>6.2f} %  | {r.get('latency_ms', 0):>6.2f} ms | "
                f"{r.get('model_size_mb', 0):>6.2f} MB | {r.get('energy_j', 0):>6.4f} J  | "
                f"{r.get('overall_score', 0):>6.2f} | {is_p}"
            )

        lines.extend([
            "",
            "3. MULTI-OBJECTIVE WINNER ANALYSIS & RATIONALE",
            subsep,
            f"* Best Overall Score      : {winners.get('best_overall', {}).get('algorithm', 'N/A')} ({winners.get('best_overall', {}).get('overall_score', 0):.2f}/100)",
            f"* Highest Accuracy        : {winners.get('best_accuracy', {}).get('algorithm', 'N/A')} ({winners.get('best_accuracy', {}).get('accuracy', 0):.2f}%)",
            f"* Lowest Latency          : {winners.get('lowest_latency', {}).get('algorithm', 'N/A')} ({winners.get('lowest_latency', {}).get('latency_ms', 0):.2f} ms)",
            f"* Smallest Model Footprint: {winners.get('smallest_model', {}).get('algorithm', 'N/A')} ({winners.get('smallest_model', {}).get('model_size_mb', 0):.2f} MB)",
            f"* Lowest Energy Draw      : {winners.get('lowest_energy', {}).get('algorithm', 'N/A')} ({winners.get('lowest_energy', {}).get('energy_j', 0):.4f} Joules)",
            "",
            f"Rationale: {winners.get('rationale', 'Evaluated under strict hardware and dataset controls.')}",
            "",
            "4. ABLATION STUDY DECOMPOSITION",
            subsep,
            f"{'Stage Name':<20} | {'Accuracy':<10} | {'Latency':<10} | {'Size':<10} | {'Energy':<10} | {'Description'}",
            subsep,
        ])

        for a in ablations:
            lines.append(
                f"{a.get('stage_name', ''):<20} | {a.get('accuracy', 0):>6.2f} %  | "
                f"{a.get('latency_ms', 0):>6.2f} ms | {a.get('model_size_mb', 0):>6.2f} MB | "
                f"{a.get('energy_j', 0):>6.4f} J  | {a.get('description', '')}"
            )

        lines.extend([
            "",
            "5. SCIENTIFIC REPRODUCIBILITY & AUDIT DISCLOSURES",
            subsep,
            "1. Latency measurements were captured after 50 unmeasured warm-up iterations on synchronized hardware.",
            "2. Metaheuristics adhere to standardized search vector bounds [0, 1]^D and population controls.",
            "3. Algorithmic superiority is contextual to the defined weights and model-dataset architecture.",
            sep,
            "CNN Optimization Benchmark Platform (https://cnn.umeshlabs.in)",
            sep,
        ])

        return "\n".join(lines)

    @staticmethod
    def generate_doc_report(
        experiment_data: Dict[str, Any],
        ranked_runs: List[Dict[str, Any]],
        winners: Dict[str, Any],
        ablations: List[Dict[str, Any]],
    ) -> str:
        """Generate Microsoft Word / Google Docs compatible formatted HTML document (.doc)."""
        exp_id = experiment_data.get("id", "EXP-0000")
        title = experiment_data.get("title", "CNN Optimization Benchmark")
        pareto_algs = set(experiment_data.get("pareto_optimal_algorithms", []))

        table_rows = ""
        for r in ranked_runs:
            is_p = "<b>YES</b>" if r.get("algorithm") in pareto_algs else "NO"
            table_rows += f"""
            <tr>
                <td style="padding: 6px 10px; border: 1px solid #ccc; text-align: center;">#{r.get('rank', '-')}</td>
                <td style="padding: 6px 10px; border: 1px solid #ccc; font-weight: bold;">{r.get('algorithm')}</td>
                <td style="padding: 6px 10px; border: 1px solid #ccc; text-align: right;">{r.get('accuracy', 0):.2f}%</td>
                <td style="padding: 6px 10px; border: 1px solid #ccc; text-align: right;">{r.get('latency_ms', 0):.2f} ms</td>
                <td style="padding: 6px 10px; border: 1px solid #ccc; text-align: right;">{r.get('model_size_mb', 0):.2f} MB</td>
                <td style="padding: 6px 10px; border: 1px solid #ccc; text-align: right;">{r.get('energy_j', 0):.4f} J</td>
                <td style="padding: 6px 10px; border: 1px solid #ccc; text-align: right;">{r.get('flops_m', 0):.1f} M</td>
                <td style="padding: 6px 10px; border: 1px solid #ccc; text-align: right; font-weight: bold; color: #0284c7;">{r.get('overall_score', 0):.2f}</td>
                <td style="padding: 6px 10px; border: 1px solid #ccc; text-align: center;">{is_p}</td>
            </tr>
            """

        ablation_rows = ""
        for a in ablations:
            ablation_rows += f"""
            <tr>
                <td style="padding: 6px 10px; border: 1px solid #ccc; font-weight: bold;">{a.get('stage_name')}</td>
                <td style="padding: 6px 10px; border: 1px solid #ccc; text-align: right;">{a.get('accuracy', 0):.2f}%</td>
                <td style="padding: 6px 10px; border: 1px solid #ccc; text-align: right;">{a.get('latency_ms', 0):.2f} ms</td>
                <td style="padding: 6px 10px; border: 1px solid #ccc; text-align: right;">{a.get('model_size_mb', 0):.2f} MB</td>
                <td style="padding: 6px 10px; border: 1px solid #ccc; text-align: right;">{a.get('energy_j', 0):.4f} J</td>
                <td style="padding: 6px 10px; border: 1px solid #ccc;">{a.get('description')}</td>
            </tr>
            """

        doc_html = f"""
        <!DOCTYPE html>
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset="utf-8">
            <title>{title} - Scientific Benchmark Report</title>
            <style>
                body {{ font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #222; margin: 40px; }}
                h1 {{ font-size: 20pt; color: #0f172a; border-bottom: 2px solid #0284c7; padding-bottom: 6px; margin-bottom: 12px; }}
                h2 {{ font-size: 14pt; color: #1e293b; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }}
                table {{ border-collapse: collapse; width: 100%; margin: 14px 0; font-size: 10pt; }}
                th {{ background-color: #f1f5f9; padding: 8px 10px; border: 1px solid #cbd5e1; text-align: left; font-weight: bold; color: #334155; }}
                .meta-box {{ background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #0284c7; padding: 12px 16px; margin-bottom: 20px; }}
                .highlight {{ background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 10px 14px; margin: 12px 0; }}
            </style>
        </head>
        <body>
            <h1>Scientific Benchmark Report: {title}</h1>
            <div class="meta-box">
                <p><strong>Experiment ID:</strong> <code>{exp_id}</code> | <strong>Timestamp:</strong> {experiment_data.get('completed_at') or 'Active'}</p>
                <p><strong>Dataset:</strong> {experiment_data.get('dataset_name')} ({experiment_data.get('dataset_split')}) | <strong>Model:</strong> {experiment_data.get('cnn_model_name')}</p>
                <p><strong>Quantization:</strong> {experiment_data.get('quantization_type')} | <strong>Pruning:</strong> {experiment_data.get('pruning_method')} ({experiment_data.get('pruning_ratio', 0)*100:.0f}% sparsity)</p>
                <p><strong>Hardware Device:</strong> {experiment_data.get('hardware', {}).get('device_name', 'Host System')}</p>
            </div>

            <h2>1. Multi-Objective Algorithm Rankings</h2>
            <table>
                <thead>
                    <tr>
                        <th style="text-align: center;">Rank</th>
                        <th>Algorithm</th>
                        <th style="text-align: right;">Accuracy</th>
                        <th style="text-align: right;">Latency</th>
                        <th style="text-align: right;">Size</th>
                        <th style="text-align: right;">Energy</th>
                        <th style="text-align: right;">FLOPs</th>
                        <th style="text-align: right;">Overall Score</th>
                        <th style="text-align: center;">Pareto</th>
                    </tr>
                </thead>
                <tbody>
                    {table_rows}
                </tbody>
            </table>

            <h2>2. Multi-Criteria Winner Analysis</h2>
            <div class="highlight">
                <p><strong>Overall Weighted Champion:</strong> {winners.get('best_overall', {}).get('algorithm', 'N/A')} (Score: {winners.get('best_overall', {}).get('overall_score', 0):.2f}/100)</p>
                <p><strong>Highest Accuracy:</strong> {winners.get('best_accuracy', {}).get('algorithm', 'N/A')} ({winners.get('best_accuracy', {}).get('accuracy', 0):.2f}%)</p>
                <p><strong>Lowest Latency:</strong> {winners.get('lowest_latency', {}).get('algorithm', 'N/A')} ({winners.get('lowest_latency', {}).get('latency_ms', 0):.2f} ms)</p>
                <p><strong>Smallest Footprint:</strong> {winners.get('smallest_model', {}).get('algorithm', 'N/A')} ({winners.get('smallest_model', {}).get('model_size_mb', 0):.2f} MB)</p>
                <p><strong>Lowest Energy Draw:</strong> {winners.get('lowest_energy', {}).get('algorithm', 'N/A')} ({winners.get('lowest_energy', {}).get('energy_j', 0):.4f} J)</p>
                <p><strong>Scientific Rationale:</strong> {winners.get('rationale', 'Evaluated under standardized controls.')}</p>
            </div>

            <h2>3. Ablation Study Sequence</h2>
            <table>
                <thead>
                    <tr>
                        <th>Stage</th>
                        <th style="text-align: right;">Accuracy</th>
                        <th style="text-align: right;">Latency</th>
                        <th style="text-align: right;">Size</th>
                        <th style="text-align: right;">Energy</th>
                        <th>Stage Description</th>
                    </tr>
                </thead>
                <tbody>
                    {ablation_rows}
                </tbody>
            </table>

            <h2>4. Scientific Reproducibility Disclosures</h2>
            <p>1. Synchronized execution prevents GPU asynchronous kernel bias.</p>
            <p>2. Statistical aggregation over N runs calculates mean and 95% confidence intervals.</p>
            <p>3. Generated by CNN Optimization Benchmark Platform (https://cnn.umeshlabs.in).</p>
        </body>
        </html>
        """
        return doc_html

    @staticmethod
    def generate_markdown_report(
        experiment_data: Dict[str, Any],
        ranked_runs: List[Dict[str, Any]],
        winners: Dict[str, Any],
        ablations: List[Dict[str, Any]],
    ) -> str:
        """Generate a complete scientific research report in Markdown."""
        exp_id = experiment_data.get("id", "EXP-0000")
        title = experiment_data.get("title", "CNN Optimization Benchmark")
        demo_badge = "\n> [!CAUTION]\n> **DEMO DATA — NOT EXPERIMENTAL RESULTS**\n" if experiment_data.get("is_demo") else ""

        lines = [
            f"# Scientific Benchmark Report: {title}",
            demo_badge,
            f"**Experiment Identifier**: `{exp_id}`  ",
            f"**Generated**: `{experiment_data.get('completed_at') or 'Active'}`  ",
            f"**Primary Research Question**: Which optimization algorithm provides the best trade-off between CNN accuracy, latency, size, and energy consumption under identical experimental conditions?\n",
            "## 1. Experimental Methodology & Fairness Conditions",
            f"- **Dataset**: {experiment_data.get('dataset_name')} ({experiment_data.get('dataset_split')})",
            f"- **CNN Architecture**: {experiment_data.get('cnn_model_name')} (Checkpoint: `{experiment_data.get('checkpoint_name')}`)",
            f"- **Quantization**: {experiment_data.get('quantization_type')}",
            f"- **Pruning**: {experiment_data.get('pruning_method')} at {experiment_data.get('pruning_ratio', 0)*100:.0f}% sparsity",
            f"- **Algorithms Evaluated**: {', '.join(experiment_data.get('selected_algorithms', []))}",
            f"- **Search Parameters**: Population = {experiment_data.get('population_size')}, Max Iterations = {experiment_data.get('max_iterations')}",
            f"- **Repetitions & Seed**: {experiment_data.get('number_of_runs')} runs with {experiment_data.get('random_seed_policy')} (Base Seed: {experiment_data.get('base_seed')})",
            f"- **Hardware Profile**: {experiment_data.get('hardware', {}).get('device_name', 'Host System')} (OS: {experiment_data.get('hardware', {}).get('os_info', 'Windows')})\n",
            "## 2. Baseline Architecture Snapshot",
            "| Metric | Baseline Value | Unit | Provenance |",
            "| :--- | :--- | :--- | :--- |",
            f"| Accuracy | {experiment_data.get('baseline', {}).get('accuracy', 0):.2f} | % | MEASURED |",
            f"| Latency | {experiment_data.get('baseline', {}).get('latency_ms', 0):.2f} | ms | MEASURED |",
            f"| Model Size | {experiment_data.get('baseline', {}).get('model_size_mb', 0):.2f} | MB | MEASURED |",
            f"| Energy | {experiment_data.get('baseline', {}).get('energy_j', 0):.4f} | J | MEASURED/ESTIMATED |",
            f"| Parameters | {experiment_data.get('baseline', {}).get('parameters_m', 0):.2f} | M | CALCULATED |",
            f"| FLOPs | {experiment_data.get('baseline', {}).get('flops_m', 0):.1f} | MFLOPs | CALCULATED |\n",
            "## 3. Algorithm Ranking & Comparative Results",
            "| Rank | Algorithm | Accuracy (%) | Latency (ms) | Size (MB) | Energy (J) | FLOPs (M) | Overall Score | Pareto Optimal |",
            "| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |",
        ]

        pareto_algs = set(experiment_data.get("pareto_optimal_algorithms", []))
        for r in ranked_runs:
            is_p = "✅ Yes" if r.get("algorithm") in pareto_algs else "No"
            lines.append(
                f"| #{r.get('rank')} | **{r.get('algorithm')}** | {r.get('accuracy', 0):.2f}% | "
                f"{r.get('latency_ms', 0):.2f} ms | {r.get('model_size_mb', 0):.2f} MB | "
                f"{r.get('energy_j', 0):.4f} J | {r.get('flops_m', 0):.1f} M | **{r.get('overall_score', 0):.2f}** | {is_p} |"
            )

        lines.extend([
            "\n## 4. Multi-Criteria Winner Analysis",
            f"- **Best Overall Weighted Score**: **{winners.get('best_overall', {}).get('algorithm', 'N/A')}** ({winners.get('best_overall', {}).get('overall_score', 0):.2f}/100)",
            f"- **Highest Accuracy**: **{winners.get('best_accuracy', {}).get('algorithm', 'N/A')}** ({winners.get('best_accuracy', {}).get('accuracy', 0):.2f}%)",
            f"- **Lowest Latency**: **{winners.get('lowest_latency', {}).get('algorithm', 'N/A')}** ({winners.get('lowest_latency', {}).get('latency_ms', 0):.2f} ms)",
            f"- **Smallest Model Size**: **{winners.get('smallest_model', {}).get('algorithm', 'N/A')}** ({winners.get('smallest_model', {}).get('model_size_mb', 0):.2f} MB)",
            f"- **Lowest Energy Consumption**: **{winners.get('lowest_energy', {}).get('algorithm', 'N/A')}** ({winners.get('lowest_energy', {}).get('energy_j', 0):.4f} J)\n",
            "### Data-Driven Winner Rationale:",
            f"> {winners.get('rationale', 'Rationale calculated from experimental telemetry.')}\n",
            "## 5. Ablation Analysis",
            "| Stage | Accuracy (%) | Latency (ms) | Size (MB) | Energy (J) | Description |",
            "| :--- | :--- | :--- | :--- | :--- | :--- |",
        ])

        for a in ablations:
            lines.append(
                f"| {a.get('stage_name')} | {a.get('accuracy', 0):.2f}% | {a.get('latency_ms', 0):.2f} ms | "
                f"{a.get('model_size_mb', 0):.2f} MB | {a.get('energy_j', 0):.4f} J | {a.get('description')} |"
            )

        lines.extend([
            "\n## 6. Research Limitations & Methodology Disclosures",
            "1. **Hardware Specificity**: Latency and energy measurements are specific to the tested device architecture and cache hierarchy.",
            "2. **Quantization Engine**: INT8 PTQ speedups depend on host SIMD/Tensor Core backend support (AVX-512 / VNNI / TensorRT).",
            "3. **Stochastic Nature**: Metaheuristics utilize pseudorandom numbers; repeated runs are evaluated to compute statistical confidence bounds.",
            "4. **Scope of Conclusion**: Algorithms are declared best *solely* under the stated dataset, model, objective weights, and search constraints, not as universal superiority.",
            "\n---\n*Report generated by CNN Optimization Benchmark Platform.*",
        ])

        return "\n".join(lines)

