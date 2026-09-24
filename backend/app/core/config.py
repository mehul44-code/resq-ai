from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "ResQ-AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite+aiosqlite:///./resqai.db"
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
    
    # Grid defaults
    DEFAULT_GRID_COLS: int = 30
    DEFAULT_GRID_ROWS: int = 20
    
    # Robot defaults
    DEFAULT_ROBOT_BATTERY: float = 100.0
    DEFAULT_ROBOT_SPEED: float = 1.0
    BATTERY_RESERVE_THRESHOLD: float = 15.0
    MOVEMENT_BATTERY_COST: float = 1.0
    RESCUE_BATTERY_COST: float = 5.0
    
    # Simulation
    DEFAULT_TICK_INTERVAL_MS: int = 500
    MAX_TICKS: int = 1000
    
    # Scoring weights
    SEVERITY_WEIGHT: float = 0.30
    TIME_CRITICALITY_WEIGHT: float = 0.25
    DETERIORATION_WEIGHT: float = 0.20
    HAZARD_EXPOSURE_WEIGHT: float = 0.15
    ACCESSIBILITY_WEIGHT: float = 0.10
    
    class Config:
        env_file = ".env"

settings = Settings()
