"""
Application Configuration and Environment Settings
Platform: Clinical Quantum-Classical Decision Support Architecture
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "app" / "data"
SAMPLE_DATA_DIR = DATA_DIR / "sample"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
MODELS_DIR = BASE_DIR / "app" / "models"
DB_DIR = BASE_DIR / "app" / "backend" / "database"

# Ensure all directories exist
for directory in [DATA_DIR, SAMPLE_DATA_DIR, PROCESSED_DATA_DIR, MODELS_DIR, DB_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    APP_NAME: str = "Quantum-Classical Clinical Risk Analytics Platform"
    APP_VERSION: str = "1.0.0-PROTOTYPE"
    API_PREFIX: str = "/api"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = f"sqlite:///{DB_DIR / 'clinical_records.db'}"
    
    # Security / RBAC
    SECRET_KEY: str = "clinical-qml-secret-research-key-2026-safe"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # Default Risk Thresholds (Configurable by Authorized Clinicians)
    THRESHOLD_LOW: float = 0.30       # 0 - 0.30: Low Risk
    THRESHOLD_MODERATE: float = 0.60  # 0.31 - 0.60: Moderate Risk
    THRESHOLD_HIGH: float = 0.80      # 0.61 - 0.80: High Risk
    # 0.81 - 1.00: Very High Risk
    
    # Quantum Default Configuration
    DEFAULT_QUBIT_COUNT: int = 4
    DEFAULT_CIRCUIT_DEPTH: int = 2
    DEFAULT_SHOTS: int = 512
    DEFAULT_QUANTUM_BACKEND: str = "AerSimulator"  # Options: AerSimulator, StatevectorSimulator, PennyLaneDefault
    QUANTUM_SIMULATOR_ONLY: bool = True
    
    # Uncertainty Warning Threshold
    UNCERTAINTY_THRESHOLD: float = 0.35  # Standard deviation or entropy flag
    
    # System Mode
    SYSTEM_MODE: str = "OFFLINE_SIMULATION"  # OFFLINE_SIMULATION, ONLINE_RESEARCH, QUANTUM_CLOUD_STAGING

settings = Settings()
