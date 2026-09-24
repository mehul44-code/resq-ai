import pytest
from app.services.simulation.types import (
    VictimState, RobotState, Position, Severity, InjuryType, MobilityStatus, RobotStatus
)
from app.services.triage.priority_engine import VictimTriageEngine
from app.services.simulation.environment import DisasterEnvironment
from app.services.planning.astar import AStarPlanner

@pytest.fixture
def env():
    e = DisasterEnvironment(cols=20, rows=15, seed=42)
    return e

@pytest.fixture
def robot(env):
    r = RobotState(
        id="R01", position=Position(1, 1), battery=100.0, max_battery=100.0,
        speed=1.0, status=RobotStatus.IDLE, base_position=Position(1, 1)
    )
    env.robot = r
    return r

def make_victim(vid, x, y, severity, health=80, urgency=0.5):
    return VictimState(
        id=vid, position=Position(x, y), severity=severity,
        health=health, urgency=urgency, age=30,
        injury_type=InjuryType.TRAUMA, mobility_status=MobilityStatus.IMMOBILE,
        time_since_incident=10, hazard_exposure=0.0
    )

def test_critical_victim_ranks_highest(env, robot):
    triage = VictimTriageEngine()
    planner = AStarPlanner(env)
    
    critical = make_victim("V01", 5, 5, Severity.CRITICAL, health=40, urgency=0.9)
    low = make_victim("V02", 3, 3, Severity.LOW, health=90, urgency=0.1)
    
    env.add_victim(critical)
    env.add_victim(low)
    
    results = triage.rank_victims([critical, low], robot, planner, env)
    assert results[0].victim_id == "V01", "Critical victim should rank first"

def test_priority_scores_in_range(env, robot):
    triage = VictimTriageEngine()
    planner = AStarPlanner(env)
    
    v = make_victim("V01", 5, 5, Severity.HIGH, health=60, urgency=0.7)
    env.add_victim(v)
    
    results = triage.rank_victims([v], robot, planner, env)
    assert 0 <= results[0].score <= 100

def test_nearby_victim_vs_distant_same_severity(env, robot):
    triage = VictimTriageEngine()
    planner = AStarPlanner(env)
    
    near = make_victim("V01", 3, 3, Severity.HIGH, health=60, urgency=0.7)
    far = make_victim("V02", 18, 12, Severity.HIGH, health=60, urgency=0.7)
    
    env.add_victim(near)
    env.add_victim(far)
    
    results = triage.rank_victims([near, far], robot, planner, env)
    assert len(results) == 2
    # Near victim should generally rank at least as high as far victim with same properties
    assert results[0].score >= results[1].score

def test_rescued_victim_excluded(env, robot):
    triage = VictimTriageEngine()
    planner = AStarPlanner(env)
    
    v1 = make_victim("V01", 5, 5, Severity.HIGH)
    v2 = make_victim("V02", 8, 8, Severity.MEDIUM)
    v2.rescued = True
    
    env.add_victim(v1)
    env.add_victim(v2)
    
    results = triage.rank_victims([v1, v2], robot, planner, env)
    victim_ids = [r.victim_id for r in results]
    assert "V02" not in victim_ids
