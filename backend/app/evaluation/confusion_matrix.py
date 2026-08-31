"""
Confusion Matrix and Per-Class Degradation Evaluation Suite.

Provides unified calculation for both REAL model inference predictions and SIMULATED models.
Outputs exact mathematical metrics, normalized distributions, top confused pairs,
per-class degradation in percentage points (pp), and differential delta matrices.
"""

from typing import List, Dict, Any, Optional, Union
import numpy as np

from .dataset_registry import DatasetDefinition, get_dataset_definition
from ..simulation.confusion_simulator import SimulatedConfusionEngine


class ConfusionMatrixEvaluator:
    """
    Core service for computing, normalizing, and analyzing confusion matrices
    under dual-engine (REAL vs SIMULATION) execution architectures.
    """

    @classmethod
    def calculate_from_predictions(
        cls,
        y_true: Union[List[int], np.ndarray],
        y_pred: Union[List[int], np.ndarray],
        dataset_def: DatasetDefinition,
        baseline_y_pred: Optional[Union[List[int], np.ndarray]] = None,
        algorithm_name: str = "REAL_MODEL",
        run_index: int = 1,
        cnn_model_name: str = "ResNet-18",
        extra_metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Compute genuine confusion matrix from actual ground truth and prediction arrays.
        PROVENANCE: ACTUAL_PREDICTIONS, mode: REAL, synthetic: False.
        """
        y_t = np.asarray(y_true, dtype=np.int64)
        y_p = np.asarray(y_pred, dtype=np.int64)
        K = dataset_def.num_classes

        raw_matrix = np.zeros((K, K), dtype=np.int64)
        for t, p in zip(y_t, y_p):
            if 0 <= t < K and 0 <= p < K:
                raw_matrix[t, p] += 1

        baseline_raw_matrix = None
        if baseline_y_pred is not None:
            b_p = np.asarray(baseline_y_pred, dtype=np.int64)
            baseline_raw_matrix = np.zeros((K, K), dtype=np.int64)
            for t, p in zip(y_t, b_p):
                if 0 <= t < K and 0 <= p < K:
                    baseline_raw_matrix[t, p] += 1

        provenance = {
            "mode": "REAL",
            "provenance": "ACTUAL_PREDICTIONS",
            "synthetic": False,
            "prediction_source": "Actual Model Inference on Held-Out Test Split",
            "dataset_name": dataset_def.name,
            "cnn_model_name": cnn_model_name,
            "algorithm_name": algorithm_name,
            "run_index": run_index,
            "sample_count": len(y_t),
            "classes_count": K,
            "notes": "Computed strictly from measured model inference outputs. No synthetic generation.",
        }
        if extra_metadata:
            provenance.update(extra_metadata)

        return cls._format_evaluation_payload(
            raw_matrix=raw_matrix,
            dataset_def=dataset_def,
            baseline_raw_matrix=baseline_raw_matrix,
            provenance=provenance,
            algorithm_name=algorithm_name,
        )

    @classmethod
    def calculate_from_simulation(
        cls,
        dataset_def: DatasetDefinition,
        accuracy_pct: float,
        baseline_accuracy_pct: Optional[float] = None,
        total_samples: Optional[int] = None,
        seed: int = 42,
        pruning_ratio: float = 0.0,
        quantization_type: str = "INT8",
        algorithm_name: str = "SIM_ALGORITHM",
        run_index: int = 1,
        cnn_model_name: str = "ResNet-18",
        extra_metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generate calibrated synthetic confusion matrix when running in DEMO/Simulation mode.
        PROVENANCE: SIMULATED_MODEL, mode: SIMULATION, synthetic: True.
        """
        sim_res = SimulatedConfusionEngine.generate_matrix(
            dataset_def=dataset_def,
            accuracy_pct=accuracy_pct,
            baseline_accuracy_pct=baseline_accuracy_pct,
            total_samples=total_samples,
            seed=seed,
            pruning_ratio=pruning_ratio,
            quantization_type=quantization_type,
            algorithm_name=algorithm_name,
        )
        raw_matrix = sim_res["matrix"]

        baseline_raw_matrix = None
        if baseline_accuracy_pct is not None:
            base_sim = SimulatedConfusionEngine.generate_matrix(
                dataset_def=dataset_def,
                accuracy_pct=baseline_accuracy_pct,
                baseline_accuracy_pct=baseline_accuracy_pct,
                total_samples=total_samples,
                seed=seed,
                pruning_ratio=0.0,
                quantization_type="FP32",
                algorithm_name="BASELINE",
            )
            baseline_raw_matrix = base_sim["matrix"]

        provenance = {
            "mode": "SIMULATION",
            "provenance": "SIMULATED_MODEL",
            "synthetic": True,
            "prediction_source": "Calibrated Analytical Degradation + Semantic Affinity Model",
            "dataset_name": dataset_def.name,
            "cnn_model_name": cnn_model_name,
            "algorithm_name": algorithm_name,
            "run_index": run_index,
            "sample_count": int(sim_res["total_samples"]),
            "classes_count": dataset_def.num_classes,
            "calibration": f"Target Accuracy: {accuracy_pct:.2f}%, Pruning: {pruning_ratio*100:.0f}%, Quant: {quantization_type}",
            "notes": "DEMO DATA — Statistically synthesized for zero-GPU demo deployment. Deploy locally with PyTorch for real measurements.",
        }
        if extra_metadata:
            provenance.update(extra_metadata)

        return cls._format_evaluation_payload(
            raw_matrix=raw_matrix,
            dataset_def=dataset_def,
            baseline_raw_matrix=baseline_raw_matrix,
            provenance=provenance,
            algorithm_name=algorithm_name,
        )

    @classmethod
    def _format_evaluation_payload(
        cls,
        raw_matrix: np.ndarray,
        dataset_def: DatasetDefinition,
        baseline_raw_matrix: Optional[np.ndarray],
        provenance: Dict[str, Any],
        algorithm_name: str,
    ) -> Dict[str, Any]:
        """
        Assemble the complete, normalized, and detailed analysis payload.
        """
        K = dataset_def.num_classes
        raw_matrix = np.asarray(raw_matrix, dtype=np.int64)

        # ── 1. Row-Normalized Percentage Matrix ─────────────────────────────
        row_sums = raw_matrix.sum(axis=1, keepdims=True)
        # Avoid division by zero for classes with 0 support
        safe_row_sums = np.where(row_sums == 0, 1.0, row_sums.astype(np.float64))
        norm_matrix = (raw_matrix.astype(np.float64) / safe_row_sums) * 100.0

        # Baseline normalized matrix if available
        baseline_norm_matrix = None
        if baseline_raw_matrix is not None:
            baseline_raw_matrix = np.asarray(baseline_raw_matrix, dtype=np.int64)
            b_row_sums = baseline_raw_matrix.sum(axis=1, keepdims=True)
            safe_b_row_sums = np.where(b_row_sums == 0, 1.0, b_row_sums.astype(np.float64))
            baseline_norm_matrix = (baseline_raw_matrix.astype(np.float64) / safe_b_row_sums) * 100.0

        # ── 2. Per-Class Metrics ────────────────────────────────────────────
        col_sums = raw_matrix.sum(axis=0)
        total_samples = int(raw_matrix.sum())

        per_class_metrics: List[Dict[str, Any]] = []
        recalls: List[float] = []
        precisions: List[float] = []
        f1_scores: List[float] = []
        supports: List[int] = []

        baseline_recalls = {}
        baseline_precisions = {}
        if baseline_raw_matrix is not None:
            b_col_sums = baseline_raw_matrix.sum(axis=0)
            b_r_sums = baseline_raw_matrix.sum(axis=1)
            for i in range(K):
                tp_b = baseline_raw_matrix[i, i]
                r_b = float((tp_b / b_r_sums[i]) * 100.0) if b_r_sums[i] > 0 else 0.0
                p_b = float((tp_b / b_col_sums[i]) * 100.0) if b_col_sums[i] > 0 else 0.0
                baseline_recalls[i] = r_b
                baseline_precisions[i] = p_b

        for i in range(K):
            class_name = dataset_def.get_class_name(i)
            support = int(row_sums[i, 0])
            tp = int(raw_matrix[i, i])
            fn = int(support - tp)
            fp = int(col_sums[i] - tp)

            # Precision = TP / (TP + FP)
            precision = float((tp / (tp + fp)) * 100.0) if (tp + fp) > 0 else 0.0
            # Recall = TP / (TP + FN) = TP / support
            recall = float((tp / support) * 100.0) if support > 0 else 0.0
            # F1 = 2 * (P * R) / (P + R)
            f1 = float((2 * precision * recall) / (precision + recall)) if (precision + recall) > 0 else 0.0

            recalls.append(recall)
            precisions.append(precision)
            f1_scores.append(f1)
            supports.append(support)

            b_rec = baseline_recalls.get(i)
            b_prec = baseline_precisions.get(i)
            recall_drop = round(b_rec - recall, 2) if b_rec is not None else None
            precision_drop = round(b_prec - precision, 2) if b_prec is not None else None

            per_class_metrics.append({
                "class_index": i,
                "class_name": class_name,
                "semantic_group": dataset_def.get_semantic_group(class_name),
                "support": support,
                "true_positives": tp,
                "false_positives": fp,
                "false_negatives": fn,
                "precision": round(precision, 2),
                "recall": round(recall, 2),
                "f1_score": round(f1, 2),
                "baseline_recall": round(b_rec, 2) if b_rec is not None else None,
                "recall_drop_pp": recall_drop,  # in percentage points
                "baseline_precision": round(b_prec, 2) if b_prec is not None else None,
                "precision_drop_pp": precision_drop,
            })

        # ── 3. Global Aggregate Metrics ─────────────────────────────────────
        total_correct = int(np.trace(raw_matrix))
        overall_accuracy = float((total_correct / total_samples) * 100.0) if total_samples > 0 else 0.0
        macro_precision = float(np.mean(precisions)) if precisions else 0.0
        macro_recall = float(np.mean(recalls)) if recalls else 0.0
        macro_f1 = float(np.mean(f1_scores)) if f1_scores else 0.0

        # Weighted F1
        weighted_f1 = float(np.sum(np.array(f1_scores) * np.array(supports)) / total_samples) if total_samples > 0 else 0.0

        # ── 4. Top Confused Class Pairs ──────────────────────────────────────
        # Off-diagonal ranking: true_class i -> pred_class j (i != j)
        confused_pairs = []
        combined_pairs_dict = {}

        for i in range(K):
            true_name = dataset_def.get_class_name(i)
            row_tot = float(row_sums[i, 0])
            for j in range(K):
                if i != j:
                    cnt = int(raw_matrix[i, j])
                    pct = float((cnt / row_tot) * 100.0) if row_tot > 0 else 0.0
                    pred_name = dataset_def.get_class_name(j)

                    if cnt > 0:
                        confused_pairs.append({
                            "true_class_index": i,
                            "true_class": true_name,
                            "pred_class_index": j,
                            "predicted_class": pred_name,
                            "count": cnt,
                            "percentage_of_true_class": round(pct, 2),
                        })

                        # Symmetrical pair key (smaller_idx, larger_idx)
                        sym_key = (min(i, j), max(i, j))
                        if sym_key not in combined_pairs_dict:
                            c1_name = dataset_def.get_class_name(sym_key[0])
                            c2_name = dataset_def.get_class_name(sym_key[1])
                            combined_pairs_dict[sym_key] = {
                                "class_a": c1_name,
                                "class_b": c2_name,
                                "class_a_index": sym_key[0],
                                "class_b_index": sym_key[1],
                                "a_to_b_count": 0,
                                "b_to_a_count": 0,
                                "total_mutual_confusion": 0,
                            }
                        if i < j:
                            combined_pairs_dict[sym_key]["a_to_b_count"] = cnt
                        else:
                            combined_pairs_dict[sym_key]["b_to_a_count"] = cnt
                        combined_pairs_dict[sym_key]["total_mutual_confusion"] += cnt

        # Sort directional confused pairs descending by count
        confused_pairs.sort(key=lambda x: (x["count"], x["percentage_of_true_class"]), reverse=True)
        symmetric_confused_pairs = sorted(
            combined_pairs_dict.values(),
            key=lambda x: x["total_mutual_confusion"],
            reverse=True,
        )

        # ── 5. Degraded Classes Ranking ─────────────────────────────────────
        degraded_classes = []
        if baseline_raw_matrix is not None:
            degraded_classes = sorted(
                [c for c in per_class_metrics if c["recall_drop_pp"] is not None],
                key=lambda x: x["recall_drop_pp"],
                reverse=True,
            )

        # ── 6. Differential Delta Matrix (Optimized - Baseline) ─────────────
        delta_norm_matrix = None
        delta_raw_matrix = None
        if baseline_norm_matrix is not None:
            # ΔCM[i, j] = Optimized[i, j] - Baseline[i, j]
            # Positive diagonal: improved classification
            # Positive off-diagonal: increased confusion error
            delta_norm_matrix = np.round(norm_matrix - baseline_norm_matrix, 2).tolist()
            delta_raw_matrix = (raw_matrix - baseline_raw_matrix).tolist()

        # ── 7. Semantic Group Summary (if available) ────────────────────────
        semantic_summary = []
        if dataset_def.semantic_groups:
            for group_name, members in dataset_def.semantic_groups.items():
                member_metrics = [m for m in per_class_metrics if m["class_name"] in members]
                if member_metrics:
                    grp_support = sum(m["support"] for m in member_metrics)
                    grp_rec = np.mean([m["recall"] for m in member_metrics])
                    grp_f1 = np.mean([m["f1_score"] for m in member_metrics])
                    grp_drop = np.mean([m["recall_drop_pp"] for m in member_metrics if m["recall_drop_pp"] is not None]) if any(m["recall_drop_pp"] is not None for m in member_metrics) else None
                    semantic_summary.append({
                        "group_name": group_name,
                        "classes_count": len(members),
                        "total_support": grp_support,
                        "mean_recall": round(float(grp_rec), 2),
                        "mean_f1": round(float(grp_f1), 2),
                        "mean_recall_drop_pp": round(float(grp_drop), 2) if grp_drop is not None else None,
                    })

        return {
            "dataset": dataset_def.name,
            "classes": dataset_def.class_names,
            "classes_count": K,
            "algorithm": algorithm_name,
            "provenance": provenance,
            "raw_matrix": raw_matrix.tolist(),
            "normalized_matrix": np.round(norm_matrix, 2).tolist(),
            "baseline_raw_matrix": baseline_raw_matrix.tolist() if baseline_raw_matrix is not None else None,
            "baseline_normalized_matrix": np.round(baseline_norm_matrix, 2).tolist() if baseline_norm_matrix is not None else None,
            "delta_normalized_matrix": delta_norm_matrix,
            "delta_raw_matrix": delta_raw_matrix,
            "global_metrics": {
                "accuracy": round(overall_accuracy, 2),
                "macro_precision": round(macro_precision, 2),
                "macro_recall": round(macro_recall, 2),
                "macro_f1": round(macro_f1, 2),
                "weighted_f1": round(weighted_f1, 2),
                "total_samples": total_samples,
                "total_correct": total_correct,
            },
            "per_class_metrics": per_class_metrics,
            "top_confused_pairs": confused_pairs[:20],
            "top_symmetric_pairs": symmetric_confused_pairs[:10],
            "degraded_classes": degraded_classes,
            "semantic_summary": semantic_summary,
        }

    @classmethod
    def calculate_algorithm_differential(
        cls,
        eval_a: Dict[str, Any],
        eval_b: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Compute ΔCM = Algorithm A - Algorithm B.
        Validates equivalent dataset and class cardinality.
        """
        if eval_a["dataset"] != eval_b["dataset"]:
            raise ValueError(
                f"Cannot compute differential across different datasets: '{eval_a['dataset']}' vs '{eval_b['dataset']}'"
            )
        if eval_a["classes_count"] != eval_b["classes_count"]:
            raise ValueError(
                f"Class cardinality mismatch: {eval_a['classes_count']} vs {eval_b['classes_count']}"
            )

        norm_a = np.array(eval_a["normalized_matrix"], dtype=np.float64)
        norm_b = np.array(eval_b["normalized_matrix"], dtype=np.float64)
        raw_a = np.array(eval_a["raw_matrix"], dtype=np.int64)
        raw_b = np.array(eval_b["raw_matrix"], dtype=np.int64)

        delta_norm = np.round(norm_a - norm_b, 2).tolist()
        delta_raw = (raw_a - raw_b).tolist()

        return {
            "comparison_type": "ALGORITHM_A_VS_ALGORITHM_B",
            "algorithm_a": eval_a.get("algorithm", "Algorithm A"),
            "algorithm_b": eval_b.get("algorithm", "Algorithm B"),
            "delta_normalized_matrix": delta_norm,
            "delta_raw_matrix": delta_raw,
            "accuracy_diff": round(eval_a["global_metrics"]["accuracy"] - eval_b["global_metrics"]["accuracy"], 2),
            "macro_f1_diff": round(eval_a["global_metrics"]["macro_f1"] - eval_b["global_metrics"]["macro_f1"], 2),
        }
