from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any

# === ENUMS ===

class CellType(str, Enum):
    EMPTY = "empty"
    WALL = "wall"
    OBSTACLE = "obstacle"
    VICTIM = "victim"
    FIRE = "fire"
    SMOKE = "smoke"
    DANGEROUS_ZONE = "dangerous_zone"
    SAFE_ZONE = "safe_zone"
    BASE = "base"
    BLOCKED = "blocked"
    CHARGING_STATION = "charging_station"

class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class InjuryType(str, Enum):
    TRAUMA = "trauma"
    BURN = "burn"
    CRUSH = "crush"
    RESPIRATORY = "respiratory"
    UNKNOWN = "unknown"

class MobilityStatus(str, Enum):
    MOBILE = "mobile"
    LIMITED = "limited"
    IMMOBILE = "immobile"

class RobotStatus(str, Enum):
    IDLE = "IDLE"
    ASSESSING = "ASSESSING"
    SELECTING_TARGET = "SELECTING_TARGET"
    PLANNING = "PLANNING"
    MOVING = "MOVING"
    RESCUING = "RESCUING"
    REPLANNING = "REPLANNING"
    RETURNING_TO_BASE = "RETURNING_TO_BASE"
    CHARGING = "CHARGING"
    COMPLETED = "COMPLETED"
    ABORTED = "ABORTED"
    STUCK = "STUCK"

class ActionType(str, Enum):
    MOVE_TO_TARGET = "MOVE_TO_TARGET"
    RESCUE_VICTIM = "RESCUE_VICTIM"
    AVOID_HAZARD = "AVOID_HAZARD"
    REPLAN = "REPLAN"
    RETURN_TO_BASE = "RETURN_TO_BASE"
    CHARGE = "CHARGE"
    WAIT = "WAIT"
    ABORT = "ABORT"
    COMPLETE_MISSION = "COMPLETE_MISSION"

class HazardType(str, Enum):
    FIRE = "FIRE"
    SMOKE = "SMOKE"
    BLOCKED_ROUTE = "BLOCKED_ROUTE"
    DANGEROUS_ZONE = "DANGEROUS_ZONE"

class PathOutcome(str, Enum):
    SAFE_PATH_FOUND = "SAFE_PATH_FOUND"
    SAFE_BUT_EXPENSIVE = "SAFE_BUT_EXPENSIVE"
    HIGH_RISK_PATH = "HIGH_RISK_PATH"
    NO_SAFE_PATH = "NO_SAFE_PATH"
    TARGET_UNREACHABLE = "TARGET_UNREACHABLE"

class ReasonCode(str, Enum):
    CRITICAL_MEDICAL_STATE = "CRITICAL_MEDICAL_STATE"
    HIGH_HAZARD_EXPOSURE = "HIGH_HAZARD_EXPOSURE"
    RAPID_DETERIORATION = "RAPID_DETERIORATION"
    REACHABLE_WITH_ACCEPTABLE_RISK = "REACHABLE_WITH_ACCEPTABLE_RISK"
    LOW_BATTERY = "LOW_BATTERY"
    ROUTE_BLOCKED = "ROUTE_BLOCKED"
    FIRE_ON_PATH = "FIRE_ON_PATH"
    SAFER_ROUTE_FOUND = "SAFER_ROUTE_FOUND"
    BATTERY_INSUFFICIENT = "BATTERY_INSUFFICIENT"
    NO_SAFE_ROUTE = "NO_SAFE_ROUTE"
    VICTIM_DETERIORATING = "VICTIM_DETERIORATING"
    VICTIM_NEAREST = "VICTIM_NEAREST"
    RETURNING_FOR_CHARGE = "RETURNING_FOR_CHARGE"
    MISSION_COMPLETE = "MISSION_COMPLETE"
    REPLAN_TRIGGERED = "REPLAN_TRIGGERED"
    ALTERNATIVE_ROUTE = "ALTERNATIVE_ROUTE"
    HIGH_PRIORITY_VICTIM = "HIGH_PRIORITY_VICTIM"
    CLOSEST_REACHABLE = "CLOSEST_REACHABLE"
    PATH_INVALIDATED = "PATH_INVALIDATED"
    EMERGENCY_HAZARD = "EMERGENCY_HAZARD"

class EventType(str, Enum):
    SIMULATION_STARTED = "simulation_started"
    TICK_UPDATED = "tick_updated"
    ROBOT_MOVED = "robot_moved"
    VICTIM_DETECTED = "victim_detected"
    VICTIM_UPDATED = "victim_updated"
    VICTIM_RESCUED = "victim_rescued"
    HAZARD_CHANGED = "hazard_changed"
    FIRE_SPREAD = "fire_spread"
    DECISION_CREATED = "decision_created"
    REPLAN_TRIGGERED = "replan_triggered"
    RESCUE_COMPLETED = "rescue_completed"
    BATTERY_UPDATED = "battery_updated"
    MISSION_COMPLETED = "mission_completed"
    ROBOT_STATE_CHANGED = "robot_state_changed"
    PATH_PLANNED = "path_planned"
    PATH_INVALIDATED = "path_invalidated"
    ROBOT_RETURNED_BASE = "robot_returned_base"
    CHARGING_STARTED = "charging_started"
    CHARGING_COMPLETED = "charging_completed"
    TRIAGE_COMPLETED = "triage_completed"
    MISSION_REASSESSMENT = "mission_reassessment"

class SimulationStatus(str, Enum):
    IDLE = "IDLE"
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    ABORTED = "ABORTED"

# === DATACLASSES ===

@dataclass
class Position:
    x: int
    y: int
    
    def to_tuple(self):
        return (self.x, self.y)
    
    def distance_to(self, other: 'Position') -> float:
        return abs(self.x - other.x) + abs(self.y - other.y)
    
    def __eq__(self, other):
        return isinstance(other, Position) and self.x == other.x and self.y == other.y
    
    def __hash__(self):
        return hash((self.x, self.y))

@dataclass
class GridCell:
    x: int
    y: int
    cell_type: CellType = CellType.EMPTY
    hazard_level: float = 0.0  # 0-1
    is_passable: bool = True
    fire_intensity: float = 0.0  # 0-1
    smoke_density: float = 0.0  # 0-1
    movement_cost_multiplier: float = 1.0
    victim_id: Optional[str] = None

@dataclass
class VictimState:
    id: str
    position: Position
    severity: Severity
    health: float  # 0-100
    urgency: float  # 0-1
    age: int
    injury_type: InjuryType
    mobility_status: MobilityStatus
    time_since_incident: float  # ticks
    hazard_exposure: float  # 0-1
    rescued: bool = False
    rescue_time: Optional[float] = None
    priority_score: float = 0.0
    deterioration_rate: float = 0.02  # health lost per tick
    
    def is_alive(self) -> bool:
        return self.health > 0 and not self.rescued

@dataclass
class HazardState:
    id: str
    hazard_type: HazardType
    position: Position
    intensity: float  # 0-1
    spread_rate: float  # cells per spread_interval ticks
    spread_interval: int  # ticks between spreads
    last_spread_tick: int = 0
    affected_cells: List[Position] = field(default_factory=list)
    max_spreads: Optional[int] = None

@dataclass
class RobotState:
    id: str
    position: Position
    battery: float
    max_battery: float
    speed: float
    status: RobotStatus
    current_target: Optional[str] = None  # victim id
    current_path: List[Position] = field(default_factory=list)
    previous_path: List[Position] = field(default_factory=list)
    path_index: int = 0
    current_action: Optional[ActionType] = None
    base_position: Position = field(default_factory=lambda: Position(0, 0))
    rescue_ticks_remaining: int = 0
    total_distance: float = 0.0
    battery_consumed: float = 0.0
    victims_rescued: int = 0
    replans_count: int = 0

@dataclass
class PathResult:
    outcome: PathOutcome
    path: List[Position]
    cost: float
    risk_score: float
    estimated_ticks: int
    start: Position
    goal: Position
    reason: str = ""
    battery_required: float = 0.0

@dataclass  
class PriorityResult:
    victim_id: str
    score: float
    reason_codes: List[ReasonCode]
    breakdown: Dict[str, float]

@dataclass
class DecisionResult:
    action: ActionType
    target: Optional[str]
    priority: float
    score: float
    reason_codes: List[ReasonCode]
    explanation: str
    path_result: Optional[PathResult]
    replan_required: bool
    alternative_actions: List[ActionType]
    constraints_checked: List[str]
    candidate_evaluations: List[Dict[str, Any]] = field(default_factory=list)

@dataclass
class SimEvent:
    event_type: EventType
    tick: int
    timestamp: str
    data: Dict[str, Any]
    simulation_id: str
