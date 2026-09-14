"""
Classical Machine Learning Baselines & Evaluator
Implements Logistic Regression, Random Forest, and XGBoost as the primary classical engine.
Calculates clinical metrics including Sensitivity/Recall, Specificity, ROC-AUC, PR-AUC, and Calibration.
"""

import time
from typing import Dict, Any, List, Tuple
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, AdaBoostClassifier
import xgboost as xgb
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix, brier_score_loss
)

def evaluate_classifier(model, X: np.ndarray, y: np.ndarray) -> Dict[str, Any]:
    """Calculates full clinical metric panel."""
    t0 = time.perf_counter()
    y_pred = model.predict(X)
    inference_time_ms = (time.perf_counter() - t0) * 1000.0 / len(X)

    if hasattr(model, "predict_proba"):
        y_prob = model.predict_proba(X)[:, 1]
    else:
        y_prob = y_pred.astype(float)

    acc = float(accuracy_score(y, y_pred))
    prec = float(precision_score(y, y_pred, zero_division=0))
    sens = float(recall_score(y, y_pred, zero_division=0))  # Sensitivity / Recall
    f1 = float(f1_score(y, y_pred, zero_division=0))

    try:
        roc_auc = float(roc_auc_score(y, y_prob))
    except Exception:
        roc_auc = 0.5

    try:
        pr_auc = float(average_precision_score(y, y_prob))
    except Exception:
        pr_auc = 0.5

    cm = confusion_matrix(y, y_pred)
    if cm.shape == (2, 2):
        tn, fp, fn, tp = cm.ravel()
        spec = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
    else:
        tn, fp, fn, tp = int(cm[0, 0]), 0, 0, 0
        spec = 1.0

    brier = float(brier_score_loss(y, y_prob))

    return {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(sens, 4),
        "sensitivity": round(sens, 4),
        "specificity": round(spec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(roc_auc, 4),
        "pr_auc": round(pr_auc, 4),
        "brier_score": round(brier, 4),
        "confusion_matrix": {
            "true_negative": int(tn),
            "false_positive": int(fp),
            "false_negative": int(fn),
            "true_positive": int(tp)
        },
        "inference_time_ms": round(inference_time_ms, 3)
    }

class ClassicalMLSuite:
    """Manages baseline models, AdaBoost, and XGBoost feature importance ranking."""

    def __init__(self):
        self.log_reg = LogisticRegression(max_iter=1000, random_state=42)
        self.random_forest = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
        self.adaboost_model = AdaBoostClassifier(n_estimators=80, learning_rate=0.8, random_state=42)
        self.xgboost_model = xgb.XGBClassifier(
            n_estimators=120,
            max_depth=4,
            learning_rate=0.08,
            subsample=0.85,
            eval_metric="logloss",
            random_state=42
        )
        self.models = {
            "Logistic Regression": self.log_reg,
            "Random Forest": self.random_forest,
            "AdaBoost": self.adaboost_model,
            "XGBoost": self.xgboost_model
        }
        self.feature_importances: List[Dict[str, Any]] = []
        self.top_features: List[str] = []

    def train_all(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_test: np.ndarray,
        y_test: np.ndarray,
        feature_names: List[str],
        top_k_features: int = 4
    ) -> Dict[str, Any]:
        """Trains all classical models, evaluates them on test data, and calculates feature importance."""
        results = {}

        for name, model in self.models.items():
            t_start = time.perf_counter()
            model.fit(X_train, y_train)
            train_time = time.perf_counter() - t_start

            test_metrics = evaluate_classifier(model, X_test, y_test)
            train_metrics = evaluate_classifier(model, X_train, y_train)

            gen_gap = round(train_metrics["roc_auc"] - test_metrics["roc_auc"], 4)
            if gen_gap > 0.15:
                overfit_status = "Potential Overfitting"
            elif gen_gap > 0.08:
                overfit_status = "Moderate Gap"
            else:
                overfit_status = "Healthy Generalization"

            results[name] = {
                "train_metrics": train_metrics,
                "test_metrics": test_metrics,
                "training_time_seconds": round(train_time, 3),
                "generalization_gap": gen_gap,
                "overfitting_status": overfit_status
            }

        # Calculate XGBoost Feature Importances (Gain & Weight)
        xgb_imp = self.xgboost_model.feature_importances_
        sorted_indices = np.argsort(xgb_imp)[::-1]

        self.feature_importances = []
        for idx in sorted_indices:
            feat_name = feature_names[idx] if idx < len(feature_names) else f"feature_{idx}"
            score = float(xgb_imp[idx])
            self.feature_importances.append({
                "feature": feat_name,
                "importance": round(score, 4),
                "original_index": int(idx)
            })

        # Select top-k for quantum stage
        k = min(top_k_features, len(self.feature_importances))
        self.top_features = [item["feature"] for item in self.feature_importances[:k]]
        self.top_indices = [item["original_index"] for item in self.feature_importances[:k]]

        return {
            "model_results": results,
            "feature_importances": self.feature_importances,
            "selected_top_features": self.top_features,
            "selected_indices": self.top_indices
        }

    def predict_xgb_risk(self, X: np.ndarray) -> float:
        """Outputs probability risk from the calibrated XGBoost model."""
        prob = self.xgboost_model.predict_proba(X)
        return float(prob[0, 1])

    def predict_adaboost_risk(self, X: np.ndarray) -> float:
        """Outputs probability risk from the trained AdaBoost model."""
        prob = self.adaboost_model.predict_proba(X)
        return float(prob[0, 1])

