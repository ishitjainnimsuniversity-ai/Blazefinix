"""
Hybrid Quantum-Classical Ensemble Model
Combines classical XGBoost probability with Variational Quantum Classifier expectation risk.
Documents mathematical combination strategy and uncertainty calibration.
"""

from typing import Dict, Any, Tuple
import numpy as np
from sklearn.metrics import (
    accuracy_score, recall_score, precision_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix
)

class HybridQuantumClassicalClassifier:
    """
    Ensemble Architecture:
    1. Preprocessing & Full Feature Space -> XGBoost Classical Engine
    2. Selected Top-K Informative Features -> Variational Quantum Classifier (VQC)
    3. Calibrated Combination:
       P_hybrid = alpha * P_classical + (1 - alpha) * P_quantum
       Default alpha = 0.60 (giving slight preference to high-capacity classical trees while injecting quantum kernel properties)
    """

    def __init__(self, classical_weight: float = 0.60, combination_method: str = "weighted_average"):
        self.classical_weight = classical_weight
        self.combination_method = combination_method  # weighted_average, confidence_weighted, stacking

    def combine_risks(
        self,
        classical_prob: float,
        quantum_prob: float,
        classical_confidence: float = 0.85,
        quantum_confidence: float = 0.75
    ) -> Tuple[float, float]:
        """
        Combines classical and quantum risk probabilities.
        Returns: (hybrid_risk, discordance_uncertainty)
        """
        if self.combination_method == "confidence_weighted":
            total_weight = classical_confidence + quantum_confidence
            w_c = classical_confidence / total_weight
            w_q = quantum_confidence / total_weight
            hybrid = (w_c * classical_prob) + (w_q * quantum_prob)
        else:
            # Default weighted average
            hybrid = (self.classical_weight * classical_prob) + ((1.0 - self.classical_weight) * quantum_prob)

        # Discordance between classical and quantum models measures epistemic uncertainty
        discordance = abs(classical_prob - quantum_prob)
        uncertainty = round(discordance * 0.5 + (1.0 - max(classical_prob, 1 - classical_prob)) * 0.3, 4)

        return round(float(hybrid), 4), round(float(uncertainty), 4)

    def combine_multimodal_risks(
        self,
        xgb_prob: float,
        ada_prob: float,
        quantum_prob: float
    ) -> Tuple[float, float]:
        """
        Tri-model boosting + quantum consensus:
        P_hybrid = 0.45 * P_xgb + 0.25 * P_ada + 0.30 * P_vqc
        """
        combined = (0.45 * xgb_prob) + (0.25 * ada_prob) + (0.30 * quantum_prob)
        discordance = max(abs(xgb_prob - ada_prob), abs(xgb_prob - quantum_prob))
        uncertainty = round(discordance * 0.45 + (1.0 - max(combined, 1.0 - combined)) * 0.35, 4)
        return round(float(combined), 4), round(float(uncertainty), 4)

    def evaluate_hybrid(
        self,
        y_test: np.ndarray,
        classical_probs: np.ndarray,
        quantum_probs: np.ndarray
    ) -> Dict[str, Any]:
        """Evaluates combined hybrid predictions against test labels."""
        hybrid_probs = (
            self.classical_weight * classical_probs +
            (1.0 - self.classical_weight) * quantum_probs
        )
        preds = (hybrid_probs >= 0.50).astype(int)

        acc = float(accuracy_score(y_test, preds))
        sens = float(recall_score(y_test, preds, zero_division=0))
        prec = float(precision_score(y_test, preds, zero_division=0))
        f1 = float(f1_score(y_test, preds, zero_division=0))

        try:
            auc = float(roc_auc_score(y_test, hybrid_probs))
        except Exception:
            auc = 0.5

        try:
            pr_auc = float(average_precision_score(y_test, hybrid_probs))
        except Exception:
            pr_auc = 0.5

        cm = confusion_matrix(y_test, preds)
        if cm.shape == (2, 2):
            tn, fp, fn, tp = cm.ravel()
            spec = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
        else:
            tn, fp, fn, tp = int(cm[0, 0]), 0, 0, 0
            spec = 1.0

        return {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(sens, 4),
            "sensitivity": round(sens, 4),
            "specificity": round(spec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(auc, 4),
            "pr_auc": round(pr_auc, 4),
            "combination_strategy": f"P_hybrid = {self.classical_weight} * P_xgb + {round(1.0 - self.classical_weight, 2)} * P_vqc",
            "confusion_matrix": {
                "true_negative": int(tn),
                "false_positive": int(fp),
                "false_negative": int(fn),
                "true_positive": int(tp)
            }
        }
