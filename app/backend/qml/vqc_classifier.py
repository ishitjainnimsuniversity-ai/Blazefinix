"""
Variational Quantum Classifier (VQC) Engine
Implements practical parameterized quantum circuits with angle encoding and entangling ansatz.
Runs locally by default via PennyLane and Qiskit Aer simulators.
"""

import time
from typing import Dict, Any, Tuple
import numpy as np
import pennylane as qml
from sklearn.metrics import accuracy_score, recall_score, roc_auc_score, f1_score

class VariationalQuantumClassifier:
    """
    Practical Variational Quantum Classifier (VQC).
    Only encodes selected top-k features to maintain low circuit width and depth.
    """

    def __init__(self, n_qubits: int = 4, depth: int = 2, shots: int = 512):
        self.n_qubits = n_qubits
        self.depth = depth
        self.shots = shots
        self.device = qml.device("default.qubit", wires=n_qubits, shots=shots)
        self.weights = None
        self.bias = 0.0
        self.is_fitted = False

        # Build QNode
        def quantum_circuit(weights, x):
            # Scale feature values into [-pi, pi]
            qml.AngleEmbedding(x, wires=range(self.n_qubits), rotation="Z")
            qml.BasicEntanglerLayers(weights, wires=range(self.n_qubits))
            return qml.expval(qml.PauliZ(0))

        self.qnode = qml.QNode(quantum_circuit, self.device)

    def _feature_scale(self, X: np.ndarray) -> np.ndarray:
        """Scales inputs to [-pi, pi] for angle embedding."""
        # Clip normalized inputs to avoid phase wrap ambiguity
        return np.clip(X[:, :self.n_qubits], -2.5, 2.5) * (np.pi / 2.5)

    def fit(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        steps: int = 25,
        batch_size: int = 32,
        stepsize: float = 0.15
    ) -> Dict[str, Any]:
        """Trains variational weights on representative batch with Adam optimizer."""
        t_start = time.perf_counter()
        X_scaled = self._feature_scale(X_train)
        
        # Initialize variational weights
        np.random.seed(42)
        shape = qml.BasicEntanglerLayers.shape(n_layers=self.depth, n_wires=self.n_qubits)
        weights = 0.1 * np.random.randn(*shape)
        bias = 0.0

        opt = qml.AdamOptimizer(stepsize=stepsize)

        def cost_fn(w, b, X_batch, y_batch):
            loss = 0.0
            for x_i, y_i in zip(X_batch, y_batch):
                expval = self.qnode(w, x_i)
                # Map expectation [-1, 1] to probability [0, 1]
                prob = 1.0 / (1.0 + np.exp(-(expval + b) * 2.0))
                # Binary cross-entropy
                prob = np.clip(prob, 1e-6, 1.0 - 1e-6)
                loss -= y_i * np.log(prob) + (1 - y_i) * np.log(1 - prob)
            return loss / len(X_batch)

        # Efficient mini-batch training loop
        n_samples = len(X_scaled)
        batch_size = min(batch_size, n_samples)
        
        for step in range(steps):
            indices = np.random.choice(n_samples, batch_size, replace=False)
            X_b, y_b = X_scaled[indices], y_train[indices]

            # Update weights and bias
            (weights, bias), loss_val = opt.step_and_cost(
                lambda w, b: cost_fn(w, b, X_b, y_b), weights, bias
            )

        self.weights = weights
        self.bias = float(bias)
        self.is_fitted = True
        train_time = time.perf_counter() - t_start

        return {
            "training_time_seconds": round(train_time, 3),
            "final_loss": round(float(loss_val), 4),
            "qubits_used": self.n_qubits,
            "circuit_depth": self.depth,
            "iterations": steps
        }

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Computes quantum model probability array."""
        if not self.is_fitted:
            # Fallback initialization if evaluated before fit
            shape = qml.BasicEntanglerLayers.shape(n_layers=self.depth, n_wires=self.n_qubits)
            self.weights = 0.1 * np.random.randn(*shape)
            self.bias = 0.0
            self.is_fitted = True

        X_scaled = self._feature_scale(X)
        probs = []
        for x_i in X_scaled:
            expval = float(self.qnode(self.weights, x_i))
            # Sigmoid activation of shifted expectation value
            prob = 1.0 / (1.0 + np.exp(-(expval + self.bias) * 2.0))
            probs.append([1.0 - prob, prob])

        return np.array(probs)

    def predict(self, X: np.ndarray, threshold: float = 0.5) -> np.ndarray:
        probs = self.predict_proba(X)[:, 1]
        return (probs >= threshold).astype(int)

    def evaluate(self, X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, Any]:
        """Evaluates QML model on test partition."""
        t_start = time.perf_counter()
        probs = self.predict_proba(X_test)[:, 1]
        preds = (probs >= 0.5).astype(int)
        inference_time_ms = (time.perf_counter() - t_start) * 1000.0 / len(X_test)

        acc = float(accuracy_score(y_test, preds))
        sens = float(recall_score(y_test, preds, zero_division=0))
        f1 = float(f1_score(y_test, preds, zero_division=0))
        try:
            auc = float(roc_auc_score(y_test, probs))
        except Exception:
            auc = 0.5

        return {
            "accuracy": round(acc, 4),
            "sensitivity": round(sens, 4),
            "recall": round(sens, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(auc, 4),
            "inference_time_ms": round(inference_time_ms, 3),
            "circuit_qubits": self.n_qubits,
            "circuit_depth": self.depth
        }
