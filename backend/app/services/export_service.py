"""
Export Service for Research Reports, CSV, JSON, and Markdown.
"""

import json
import io
import csv
from typing import Dict, Any, List


class ExportService:
    """Exports benchmark data into multiple scientific formats."""

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
