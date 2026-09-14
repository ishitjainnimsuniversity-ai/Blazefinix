"""
Healthcare Data Preprocessor & Data Quality Engine
Strictly prevents data leakage by fitting transformations only on training partitions.
Implements patient-level split logic and comprehensive dataset health auditing.
"""

from typing import Tuple, Dict, Any, List, Optional
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.decomposition import PCA

class DataQualityEngine:
    """Evaluates raw clinical datasets for validity, missingness, outliers, and balance."""

    @staticmethod
    def audit_dataset(df: pd.DataFrame, target_col: Optional[str] = "disease_risk_label") -> Dict[str, Any]:
        total_rows = len(df)
        total_cols = len(df.columns)
        
        # Missing values
        missing_count = int(df.isnull().sum().sum())
        missing_pct = round((missing_count / (total_rows * total_cols if total_rows * total_cols > 0 else 1)) * 100, 2)
        
        # Duplicates
        dup_count = int(df.duplicated().sum())
        dup_pct = round((dup_count / total_rows if total_rows > 0 else 0) * 100, 2)
        
        # Outliers in numeric columns via 3*IQR
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if target_col in numeric_cols:
            numeric_cols.remove(target_col)
            
        outlier_count = 0
        for col in numeric_cols:
            q25, q75 = df[col].quantile(0.25), df[col].quantile(0.75)
            iqr = q75 - q25
            if iqr > 0:
                lower, upper = q25 - 2.5 * iqr, q75 + 2.5 * iqr
                outlier_count += int(((df[col] < lower) | (df[col] > upper)).sum())

        # Class balance check
        class_dist = {}
        balance_status = "Balanced"
        if target_col and target_col in df.columns:
            counts = df[target_col].value_counts().to_dict()
            class_dist = {str(k): int(v) for k, v in counts.items()}
            if len(counts) == 2:
                c1, c2 = list(counts.values())
                ratio = max(c1, c2) / (min(c1, c2) if min(c1, c2) > 0 else 1)
                if ratio > 3.0:
                    balance_status = "Substantial Imbalance"
                elif ratio > 1.8:
                    balance_status = "Moderate Imbalance"
                else:
                    balance_status = "Acceptable Balance"

        # Compute composite quality score (0-100)
        quality_score = 100
        quality_score -= min(35, int(missing_pct * 3.5))
        quality_score -= min(25, int(dup_pct * 5.0))
        if outlier_count > total_rows * 0.15:
            quality_score -= 10
        elif outlier_count > total_rows * 0.05:
            quality_score -= 5
        if balance_status == "Substantial Imbalance":
            quality_score -= 15
        elif balance_status == "Moderate Imbalance":
            quality_score -= 5

        quality_score = max(20, min(100, quality_score))

        if quality_score >= 90:
            grade = "Excellent Quality"
            recommendation = "Dataset is clean and well-conditioned for high-fidelity clinical and quantum modeling."
        elif quality_score >= 75:
            grade = "Good Quality"
            recommendation = "Mild imputation and standard scaling recommended during preprocessing pipeline."
        elif quality_score >= 60:
            grade = "Acceptable with Caution"
            recommendation = "Noticeable missingness or skew detected. Preprocessing imputation will be rigorously applied."
        else:
            grade = "Poor Quality"
            recommendation = "Significant data hygiene issues. Verify source records before clinical deployment."

        return {
            "total_records": total_rows,
            "total_features": total_cols,
            "missing_values_count": missing_count,
            "missing_values_pct": missing_pct,
            "duplicate_records_count": dup_count,
            "duplicate_records_pct": dup_pct,
            "class_distribution": class_dist,
            "class_balance_status": balance_status,
            "outliers_detected": outlier_count,
            "quality_score": quality_score,
            "quality_grade": grade,
            "recommendation": recommendation
        }

class ClinicalPreprocessor:
    """Reproducible preprocessing pipeline ensuring zero train-test data leakage."""

    def __init__(self):
        self.imputer = SimpleImputer(strategy="median")
        self.scaler = StandardScaler()
        self.feature_names: List[str] = []
        self.target_name: str = "disease_risk_label"
        self.is_fitted: bool = False

    def fit_transform(
        self,
        df: pd.DataFrame,
        target_col: str = "disease_risk_label",
        patient_id_col: Optional[str] = "patient_id",
        test_size: float = 0.20,
        random_state: int = 42
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, List[str]]:
        """
        Splits dataset by patient identifier (if present) to prevent leakage,
        then fits imputer and scaler ONLY on the train partition.
        """
        self.target_name = target_col
        df_clean = df.copy()

        # Isolate target and ID
        if patient_id_col and patient_id_col in df_clean.columns:
            patient_ids = df_clean[patient_id_col].values
            df_features = df_clean.drop(columns=[patient_id_col, target_col])
        else:
            patient_ids = np.arange(len(df_clean))
            df_features = df_clean.drop(columns=[target_col])

        self.feature_names = df_features.columns.tolist()
        y = df_clean[target_col].values

        # Stratified train/test split on unique patient IDs
        unique_patients = np.unique(patient_ids)
        if len(unique_patients) == len(df_clean):
            # 1 row per patient
            X_train_raw, X_test_raw, y_train, y_test = train_test_split(
                df_features.values, y, test_size=test_size, random_state=random_state, stratify=y
            )
        else:
            # Multi-record patient split
            train_pats, test_pats = train_test_split(unique_patients, test_size=test_size, random_state=random_state)
            train_mask = np.isin(patient_ids, train_pats)
            test_mask = np.isin(patient_ids, test_pats)
            X_train_raw, y_train = df_features.values[train_mask], y[train_mask]
            X_test_raw, y_test = df_features.values[test_mask], y[test_mask]

        # Fit imputer and scaler STRICTLY on train partition
        X_train_imp = self.imputer.fit_transform(X_train_raw)
        X_train_scaled = self.scaler.fit_transform(X_train_imp)

        # Transform test partition with train-fitted statistics
        X_test_imp = self.imputer.transform(X_test_raw)
        X_test_scaled = self.scaler.transform(X_test_imp)

        self.is_fitted = True
        return X_train_scaled, X_test_scaled, y_train, y_test, self.feature_names

    def transform_single(self, feature_dict: Dict[str, float]) -> np.ndarray:
        """Transforms a single patient record vector using fitted statistics."""
        if not self.is_fitted:
            raise RuntimeError("Preprocessor has not been fitted on a reference dataset yet.")

        # Align features with training column order
        vec = np.zeros((1, len(self.feature_names)))
        for i, col in enumerate(self.feature_names):
            vec[0, i] = feature_dict.get(col, np.nan)

        vec_imp = self.imputer.transform(vec)
        vec_scaled = self.scaler.transform(vec_imp)
        return vec_scaled

class DimensionalityReductionEngine:
    """Stage 3: Reduces feature space for efficient quantum state encoding (PCA / Latent Projection)."""

    def __init__(self, n_components: int = 4):
        self.n_components = n_components
        self.pca = PCA(n_components=n_components, random_state=42)
        self.is_fitted = False

    def fit_transform(self, X_train: np.ndarray) -> np.ndarray:
        reduced = self.pca.fit_transform(X_train)
        self.is_fitted = True
        return reduced

    def transform(self, X: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            raise RuntimeError("PCA Dimensionality Reducer has not been fitted.")
        return self.pca.transform(X)

    @property
    def explained_variance_ratio(self) -> List[float]:
        return [round(float(v), 4) for v in self.pca.explained_variance_ratio_] if self.is_fitted else []
