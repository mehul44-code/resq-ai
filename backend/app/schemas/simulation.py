from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class CreateSimulationRequest(BaseModel):
    scenario_id: str

class SimulationResponse(BaseModel):
    id: str
    scenario_id: str
    status: str

class InjectEventRequest(BaseModel):
    event_type: str
    data: Dict[str, Any] = {}

class ScenarioMeta(BaseModel):
    id: str
    name: str
    description: str
    difficulty: str
    grid_cols: int
    grid_rows: int

class MetricsResponse(BaseModel):
    total_victims: int
    rescued_victims: int
    remaining_victims: int
    mission_completion_rate: float
    average_rescue_time: float
    total_mission_time: int
    total_distance_traveled: float
    battery_consumed: float
    battery_remaining: float
    hazards_encountered: int
    replans_count: int
    mission_score: float
    score_breakdown: Dict[str, float]
    scenario_name: str
