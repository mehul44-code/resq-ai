from typing import Dict, List
from app.services.simulation.types import (
    CellType, Position, VictimState, HazardState, RobotState,
    Severity, InjuryType, MobilityStatus, HazardType, RobotStatus
)
from app.services.simulation.environment import DisasterEnvironment
from app.core.config import settings

SCENARIOS = {
    "scenario_01": {
        "id": "scenario_01",
        "name": "Basic Building Rescue",
        "description": "A standard rescue mission in a building with 2 victims and no active fire.",
        "difficulty": "Easy",
        "grid_cols": 30, "grid_rows": 20,
        "seed": 1001,
        "tick_interval_ms": 400,
    },
    "scenario_02": {
        "id": "scenario_02",
        "name": "Fire Emergency",
        "description": "Active fire present. Robot must navigate around fire zones.",
        "difficulty": "Medium",
        "grid_cols": 30, "grid_rows": 20,
        "seed": 1002,
        "tick_interval_ms": 400,
    },
    "scenario_03": {
        "id": "scenario_03",
        "name": "Multiple Victims",
        "description": "5 victims with varying severity. Test triage prioritization.",
        "difficulty": "Medium",
        "grid_cols": 30, "grid_rows": 20,
        "seed": 1003,
        "tick_interval_ms": 400,
    },
    "scenario_04": {
        "id": "scenario_04",
        "name": "Blocked Route",
        "description": "Initial path gets blocked. Tests dynamic route replanning.",
        "difficulty": "Hard",
        "grid_cols": 30, "grid_rows": 20,
        "seed": 1004,
        "tick_interval_ms": 400,
    },
    "scenario_05": {
        "id": "scenario_05",
        "name": "Dynamic Fire Spread",
        "description": "Fire spreads during mission, invalidating planned routes.",
        "difficulty": "Hard",
        "grid_cols": 30, "grid_rows": 20,
        "seed": 1005,
        "tick_interval_ms": 500,
    },
    "scenario_06": {
        "id": "scenario_06",
        "name": "Low Battery",
        "description": "Robot starts with limited battery, must prioritize efficiently.",
        "difficulty": "Hard",
        "grid_cols": 30, "grid_rows": 20,
        "seed": 1006,
        "tick_interval_ms": 400,
        "initial_battery": 35.0,
    },
    "scenario_07": {
        "id": "scenario_07",
        "name": "High-Risk Critical Victim",
        "description": "Critical victim in a dangerous zone. Tests risk vs. urgency tradeoff.",
        "difficulty": "Hard",
        "grid_cols": 30, "grid_rows": 20,
        "seed": 1007,
        "tick_interval_ms": 400,
    },
    "scenario_08": {
        "id": "scenario_08",
        "name": "Multiple Victims + Hazards",
        "description": "Complex scenario: 6 victims, 3 fire zones, smoke, blocked routes.",
        "difficulty": "Expert",
        "grid_cols": 30, "grid_rows": 20,
        "seed": 1008,
        "tick_interval_ms": 500,
    },
    "scenario_09": {
        "id": "scenario_09",
        "name": "Changing Disaster Conditions",
        "description": "Fire spread and new hazards appear mid-mission. Tests adaptability.",
        "difficulty": "Expert",
        "grid_cols": 30, "grid_rows": 20,
        "seed": 1009,
        "tick_interval_ms": 500,
    },
    "scenario_10": {
        "id": "scenario_10",
        "name": "No Safe Route",
        "description": "Tests graceful handling when all paths are blocked.",
        "difficulty": "Expert",
        "grid_cols": 30, "grid_rows": 20,
        "seed": 1010,
        "tick_interval_ms": 400,
    },
    "demo": {
        "id": "demo",
        "name": "Competition Demo",
        "description": "Curated scenario for live competition demonstration. 3 victims, fire spread, replanning.",
        "difficulty": "Medium",
        "grid_cols": 30, "grid_rows": 20,
        "seed": 9999,
        "tick_interval_ms": 600,
    }
}

def build_scenario(scenario_id: str, simulation_id: str) -> DisasterEnvironment:
    meta = SCENARIOS.get(scenario_id)
    if not meta:
        raise ValueError(f"Unknown scenario: {scenario_id}")
    
    env = DisasterEnvironment(
        cols=meta["grid_cols"],
        rows=meta["grid_rows"],
        seed=meta["seed"]
    )
    env.simulation_id = simulation_id
    
    # Place base at top-left area
    base_pos = Position(1, 1)
    env.set_cell_type(base_pos, CellType.BASE)
    
    initial_battery = meta.get("initial_battery", settings.DEFAULT_ROBOT_BATTERY)
    robot = RobotState(
        id="ROBOT_01",
        position=base_pos,
        battery=initial_battery,
        max_battery=100.0,
        speed=1.0,
        status=RobotStatus.IDLE,
        base_position=base_pos
    )
    env.robot = robot
    
    builders = {
        "scenario_01": _build_s01,
        "scenario_02": _build_s02,
        "scenario_03": _build_s03,
        "scenario_04": _build_s04,
        "scenario_05": _build_s05,
        "scenario_06": _build_s06,
        "scenario_07": _build_s07,
        "scenario_08": _build_s08,
        "scenario_09": _build_s09,
        "scenario_10": _build_s10,
        "demo": _build_demo,
    }
    
    builder = builders.get(scenario_id)
    if builder:
        builder(env)
    
    return env

def _add_walls_border(env: DisasterEnvironment):
    """Add border walls"""
    for x in range(env.cols):
        env.set_cell_type(Position(x, 0), CellType.WALL)
        env.set_cell_type(Position(x, env.rows - 1), CellType.WALL)
    for y in range(env.rows):
        env.set_cell_type(Position(0, y), CellType.WALL)
        env.set_cell_type(Position(env.cols - 1, y), CellType.WALL)

def _add_victim(env, vid, x, y, severity, health=80, urgency=0.5, 
                injury=InjuryType.TRAUMA, mobility=MobilityStatus.IMMOBILE, age=35, det_rate=0.02):
    v = VictimState(
        id=vid, position=Position(x, y), severity=severity,
        health=health, urgency=urgency, age=age,
        injury_type=injury, mobility_status=mobility,
        time_since_incident=10, hazard_exposure=0.0,
        deterioration_rate=det_rate
    )
    env.add_victim(v)
    return v

def _add_fire(env, hid, cells, intensity=0.8, spread_rate=0.3, spread_interval=8):
    h = HazardState(
        id=hid, hazard_type=HazardType.FIRE,
        position=Position(*cells[0]), intensity=intensity,
        spread_rate=spread_rate, spread_interval=spread_interval,
        affected_cells=[Position(x, y) for x, y in cells]
    )
    env.add_hazard(h)
    return h

def _build_s01(env: DisasterEnvironment):
    _add_walls_border(env)
    for y in range(2, 18):
        env.set_cell_type(Position(10, y), CellType.WALL)
    env.set_cell_type(Position(10, 10), CellType.EMPTY)
    _add_victim(env, "V01", 20, 5, Severity.MEDIUM, health=75)
    _add_victim(env, "V02", 25, 15, Severity.HIGH, health=60, urgency=0.6)

def _build_s02(env: DisasterEnvironment):
    _add_walls_border(env)
    _add_fire(env, "H01", [(15, 8), (15, 9), (16, 8)], intensity=0.9, spread_rate=0.2, spread_interval=15)
    _add_victim(env, "V01", 22, 10, Severity.HIGH, health=65, urgency=0.7)
    _add_victim(env, "V02", 18, 5, Severity.MEDIUM, health=80)

def _build_s03(env: DisasterEnvironment):
    _add_walls_border(env)
    _add_victim(env, "V01", 5, 10, Severity.LOW, health=90, urgency=0.2)
    _add_victim(env, "V02", 15, 5, Severity.MEDIUM, health=70, urgency=0.5)
    _add_victim(env, "V03", 25, 10, Severity.CRITICAL, health=40, urgency=0.9, det_rate=0.05)
    _add_victim(env, "V04", 20, 15, Severity.HIGH, health=55, urgency=0.7)
    _add_victim(env, "V05", 10, 15, Severity.MEDIUM, health=65, urgency=0.4)

def _build_s04(env: DisasterEnvironment):
    _add_walls_border(env)
    # Wall with single passage that will get blocked
    for y in range(2, 18):
        env.set_cell_type(Position(12, y), CellType.WALL)
    env.set_cell_type(Position(12, 9), CellType.EMPTY)  # Single passage
    env.set_cell_type(Position(12, 10), CellType.EMPTY)
    _add_victim(env, "V01", 20, 10, Severity.HIGH, health=60, urgency=0.8)
    # This victim is initially near the passage that will be blocked
    _add_fire(env, "H01", [(12, 9)], intensity=0.0, spread_rate=0.0, spread_interval=9999)  # Will be triggered later

def _build_s05(env: DisasterEnvironment):
    _add_walls_border(env)
    _add_fire(env, "H01", [(8, 8)], intensity=0.9, spread_rate=0.5, spread_interval=5)
    _add_victim(env, "V01", 20, 8, Severity.HIGH, health=70, urgency=0.7)
    _add_victim(env, "V02", 25, 15, Severity.MEDIUM, health=80)

def _build_s06(env: DisasterEnvironment):
    _add_walls_border(env)
    # Low battery - robot starts at 35
    _add_victim(env, "V01", 15, 10, Severity.MEDIUM, health=75, urgency=0.5)
    _add_victim(env, "V02", 25, 10, Severity.HIGH, health=60, urgency=0.7)
    _add_victim(env, "V03", 28, 18, Severity.LOW, health=85)

def _build_s07(env: DisasterEnvironment):
    _add_walls_border(env)
    _add_fire(env, "H01", [(20, 8), (21, 8), (22, 8), (20, 9), (21, 9)], intensity=0.8, spread_rate=0.1, spread_interval=12)
    # Critical victim surrounded by fire risk
    _add_victim(env, "V01", 22, 10, Severity.CRITICAL, health=30, urgency=0.95, det_rate=0.08)
    _add_victim(env, "V02", 8, 10, Severity.LOW, health=90, urgency=0.1)

def _build_s08(env: DisasterEnvironment):
    _add_walls_border(env)
    _add_fire(env, "H01", [(10, 5), (11, 5)], intensity=0.8, spread_rate=0.3, spread_interval=6)
    _add_fire(env, "H02", [(20, 12), (21, 12)], intensity=0.9, spread_rate=0.4, spread_interval=7)
    _add_fire(env, "H03", [(15, 15)], intensity=0.7, spread_rate=0.2, spread_interval=10)
    _add_victim(env, "V01", 8, 5, Severity.HIGH, health=55, urgency=0.8)
    _add_victim(env, "V02", 14, 10, Severity.MEDIUM, health=70, urgency=0.5)
    _add_victim(env, "V03", 25, 5, Severity.CRITICAL, health=35, urgency=0.95, det_rate=0.06)
    _add_victim(env, "V04", 26, 15, Severity.HIGH, health=60, urgency=0.7)
    _add_victim(env, "V05", 5, 15, Severity.LOW, health=85, urgency=0.2)
    _add_victim(env, "V06", 18, 18, Severity.MEDIUM, health=75, urgency=0.4)

def _build_s09(env: DisasterEnvironment):
    _add_walls_border(env)
    _add_fire(env, "H01", [(5, 5)], intensity=0.8, spread_rate=0.6, spread_interval=4)  # Fast spread
    _add_victim(env, "V01", 12, 10, Severity.HIGH, health=65, urgency=0.7)
    _add_victim(env, "V02", 22, 8, Severity.MEDIUM, health=75, urgency=0.5)
    _add_victim(env, "V03", 25, 15, Severity.CRITICAL, health=45, urgency=0.9, det_rate=0.05)

def _build_s10(env: DisasterEnvironment):
    _add_walls_border(env)
    # Nearly all paths blocked
    for y in range(2, 18):
        env.set_cell_type(Position(5, y), CellType.WALL)
    for y in range(2, 18):
        env.set_cell_type(Position(10, y), CellType.WALL)
    # Very small opening
    env.set_cell_type(Position(5, 18), CellType.EMPTY)
    env.set_cell_type(Position(10, 18), CellType.EMPTY)
    _add_fire(env, "H01", [(6, 18), (7, 18), (8, 18), (9, 18)], intensity=1.0, spread_rate=0.0, spread_interval=9999)
    _add_victim(env, "V01", 15, 10, Severity.CRITICAL, health=40, urgency=0.95)

def _build_demo(env: DisasterEnvironment):
    _add_walls_border(env)
    # Interior wall creating corridors
    for y in range(3, 10):
        env.set_cell_type(Position(14, y), CellType.WALL)
    env.set_cell_type(Position(14, 6), CellType.EMPTY)  # Corridor opening (will get blocked by fire)
    env.set_cell_type(Position(14, 7), CellType.EMPTY)
    
    # Some obstacles for realism
    for x in [7, 8, 20, 21]:
        env.set_cell_type(Position(x, 12), CellType.OBSTACLE)
    
    # Victim A: CRITICAL, medium distance (primary target)
    _add_victim(env, "VA", 18, 5, Severity.CRITICAL, health=45, urgency=0.90, det_rate=0.04)
    # Victim B: LOW, nearby (second target)
    _add_victim(env, "VB", 5, 8, Severity.LOW, health=88, urgency=0.2, det_rate=0.01)
    # Victim C: HIGH, far away (third target)
    _add_victim(env, "VC", 27, 15, Severity.HIGH, health=60, urgency=0.65, det_rate=0.025)
    
    # Initial fire that will spread and block corridor route
    _add_fire(env, "H_FIRE", [(12, 6)], intensity=0.9, spread_rate=0.7, spread_interval=6)
    
    # Charging station
    env.set_cell_type(Position(1, 18), CellType.CHARGING_STATION)
