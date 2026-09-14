"""
Cross-Validation Engine for Medical Baseline Validation
Runs Stratified K-Fold validation and computes mean and standard deviation across all clinical metrics.
"""

from typing import Dict, Any, List
import numpy as np
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import roc_auc_score, recall_score, precision_score, f1_score
import xgboost as xgb

def run_stratified_cv(
    X: np.ndarray,
    y: np.ndarray,
    n_splits: int = 5,
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Executes Stratified K-Fold cross validation on the primary classical model.
    Yields honest empirical variance bounds (mean +/- std).
    """
    skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=random_state)
    
    auc_scores = []
    sens_scores = []
    prec_scores = []
    f1_scores = []

    for fold, (train_idx, val_idx) in enumerate(skf.split(X, y)):
        X_tr, y_tr = X[train_idx], y[train_idx]
        X_va, y_val = X[val_idx], y[val_idx]

        clf = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.08,
            eval_metric="logloss",
            random_state=random_state + fold
        )
        clf.fit(X_tr, y_tr)
        
        val_probs = clf.predict_proba(X_va)[:, 1]
        val_preds = clf.predict(X_va)

        auc = roc_auc_score(y_val, val_probs)
        sens = recall_score(y_val, val_preds, zero_division=0)
        prec = precision_score(y_val, val_preds, zero_division=0)
        f1 = f1_score(y_val, val_preds, zero_division=0)

        auc_scores.append(auc)
        sens_scores.append(sens)
        prec_scores.append(prec)
        f1_scores.append(f1)

    return {
        "folds": n_splits,
        "roc_auc_mean": round(float(np.mean(auc_scores)), 4),
        "roc_auc_std": round(float(np.std(auc_scores)), 4),
        "sensitivity_mean": round(float(np.mean(sens_scores)), 4),
        "sensitivity_std": round(float(np.std(sens_scores)), 4),
        "precision_mean": round(float(np.mean(prec_scores)), 4),
        "precision_std": round(float(np.std(prec_scores)), 4),
        "f1_mean": round(float(np.mean(f1_scores)), 4),
        "f1_std": round(float(np.std(f1_scores)), 4),
        "fold_aucs": [round(float(s), 4) for s in auc_scores]
    }
