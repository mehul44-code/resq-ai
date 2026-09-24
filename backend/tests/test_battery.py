import pytest
from app.services.simulation.types import RobotState, RobotStatus, Position
from app.services.safety.safety_engine import SafetyEngine

def make_robot(battery=100.0):
    return RobotState(
        id="R01", position=Position(1, 1), battery=battery, max_battery=100.0,
        speed=1.0, status=RobotStatus.IDLE, base_position=Position(1, 1)
    )

def test_battery_sufficient():
    safety = SafetyEngine()
    robot = make_robot(battery=80.0)
    ok, reason = safety.check_battery_safety(robot, battery_required=30.0)
    assert ok

def test_battery_insufficient():
    safety = SafetyEngine()
    robot = make_robot(battery=20.0)
    # Need 30 but only 20-15=5 available after reserve
    ok, reason = safety.check_battery_safety(robot, battery_required=30.0)
    assert not ok
    assert "Insufficient" in reason

def test_must_return_to_base():
    safety = SafetyEngine()
    robot = make_robot(battery=18.0)  # Only slightly above reserve threshold
    should_return, reason = safety.should_return_to_base(robot, path_to_base_cost=5.0)
    assert should_return  # 18 <= 5 + 15 = 20

def test_no_need_to_return():
    safety = SafetyEngine()
    robot = make_robot(battery=80.0)
    should_return, _ = safety.should_return_to_base(robot, path_to_base_cost=5.0)
    assert not should_return  # 80 > 5 + 15 = 20
