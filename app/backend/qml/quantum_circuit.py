"""
Quantum Circuit Builder (Qiskit & Gate Representation)
Generates parameterized feature map and variational ansatz circuits.
Encodes only the top important features into the quantum register.
"""

from typing import Dict, Any, List
import numpy as np
import qiskit
from qiskit import QuantumCircuit
from qiskit.circuit import ParameterVector

class QuantumCircuitBuilder:
    """Constructs parameterized quantum circuits for clinical feature encoding."""

    def __init__(self, n_qubits: int = 4, depth: int = 2):
        self.n_qubits = n_qubits
        self.depth = depth

    def build_qiskit_circuit(
        self,
        feature_map_name: str = "ZZFeatureMap",
        ansatz_name: str = "RealAmplitudes"
    ) -> Dict[str, Any]:
        """
        Builds complete parameterized Qiskit QuantumCircuit.
        Combines Feature Map (Data Encoding) with Variational Ansatz (Learnable Weights).
        """
        n = self.n_qubits
        qc = QuantumCircuit(n)
        
        # 1. Feature Map Parameters
        x_params = ParameterVector("x", n)
        
        # Apply Hadamard layer for superposition
        for i in range(n):
            qc.h(i)

        # Angle / ZZ Entangling Feature Map
        for i in range(n):
            qc.rz(x_params[i], i)

        if feature_map_name == "ZZFeatureMap" and n > 1:
            for i in range(n - 1):
                qc.cx(i, i + 1)
                qc.rz(x_params[i] * x_params[i + 1], i + 1)
                qc.cx(i, i + 1)

        qc.barrier()

        # 2. Variational Ansatz Parameters
        theta_count = n * (self.depth + 1)
        theta_params = ParameterVector("theta", theta_count)
        
        param_idx = 0
        for d in range(self.depth):
            for i in range(n):
                qc.ry(theta_params[param_idx], i)
                param_idx += 1
            
            # Linear entanglement
            for i in range(n - 1):
                qc.cx(i, i + 1)
            qc.barrier()

        for i in range(n):
            qc.ry(theta_params[param_idx], i)
            param_idx += 1

        # Circuit statistics
        circuit_depth = qc.depth()
        gate_counts = {k: int(v) for k, v in qc.count_ops().items()}
        total_parameters = len(qc.parameters)
        
        # Text ASCII representation
        ascii_diagram = str(qc.draw(output="text"))

        return {
            "num_qubits": n,
            "circuit_depth": circuit_depth,
            "gate_counts": gate_counts,
            "total_parameters": total_parameters,
            "feature_params_count": n,
            "variational_params_count": theta_count,
            "ascii_diagram": ascii_diagram,
            "feature_map": feature_map_name,
            "ansatz": ansatz_name
        }

    def generate_circuit_svg_metadata(self) -> List[Dict[str, Any]]:
        """Provides structured layout metadata for rendering interactive UI circuit gates."""
        layers = []
        # Layer 1: H gates
        h_layer = [{"qubit": q, "gate": "H", "param": None} for q in range(self.n_qubits)]
        layers.append({"name": "Superposition", "gates": h_layer})

        # Layer 2: Rz feature encoding
        rz_layer = [{"qubit": q, "gate": "Rz", "param": f"x[{q}]"} for q in range(self.n_qubits)]
        layers.append({"name": "Feature Encoding", "gates": rz_layer})

        # Layer 3: Entanglement CNOTs
        cnot_layer = []
        for q in range(self.n_qubits - 1):
            cnot_layer.append({"qubit": q, "target": q + 1, "gate": "CNOT", "param": None})
        layers.append({"name": "Entanglement", "gates": cnot_layer})

        # Layer 4: Parameterized Ry
        for d in range(self.depth):
            ry_layer = [{"qubit": q, "gate": "Ry", "param": f"θ[{d},{q}]"} for q in range(self.n_qubits)]
            layers.append({"name": f"Variational Layer {d+1}", "gates": ry_layer})

        # Final Layer: Measurement
        measure_layer = [{"qubit": q, "gate": "Measure", "param": "Z"} for q in range(self.n_qubits)]
        layers.append({"name": "Expectation Measurement", "gates": measure_layer})

        return layers
