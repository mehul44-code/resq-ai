import pytest
import asyncio
from app.services.simulation.simulation_manager import SimulationManager
from app.services.simulation.types import (
    EventType, SimulationStatus, RobotStatus, Position, CellType, ActionType,
    VictimState, Severity, InjuryType, MobilityStatus, RobotState
)
from app.services.agent.decision_engine import DecisionEngine
from app.services.metrics.metrics_engine import MetricsEngine

@pytest.fixture
def manager():
    return SimulationManager()

@pytest.mark.asyncio
async def test_create_and_initialize_simulation(manager):
    sim_id = manager.create_simulation("scenario_01")
    session = manager.get_simulation(sim_id)
    assert session is not None
    session.initialize()
    assert session.env is not None
    assert session.env.robot is not None

@pytest.mark.asyncio
async def test_simulation_step(manager):
    sim_id = manager.create_simulation("demo")
    session = manager.get_simulation(sim_id)
    session.initialize()
    
    initial_tick = session.env.tick
    await session.step_once()
    assert session.env.tick == initial_tick + 1

@pytest.mark.asyncio
async def test_simulation_pause_resume(manager):
    sim_id = manager.create_simulation("scenario_01")
    session = manager.get_simulation(sim_id)
    session.initialize()
    
    await session.start()
    assert session.status == SimulationStatus.RUNNING
    
    await session.pause()
    assert session.status == SimulationStatus.PAUSED
    
    await session.resume()
    assert session.status == SimulationStatus.RUNNING
    
    await session.pause()
    # Cleanup
    if session._task:
        session._task.cancel()

@pytest.mark.asyncio
async def test_simulation_reset(manager):
    sim_id = manager.create_simulation("scenario_03")
    session = manager.get_simulation(sim_id)
    session.initialize()
    
    await session.step_once()
    await session.step_once()
    assert session.env.tick == 2
    
    await session.reset()
    assert session.env.tick == 0

@pytest.mark.asyncio
async def test_demo_scenario_has_three_victims(manager):
    sim_id = manager.create_simulation("demo")
    session = manager.get_simulation(sim_id)
    session.initialize()
    assert len(session.env.victims) == 3
    victim_ids = set(session.env.victims.keys())
    assert "VA" in victim_ids
    assert "VB" in victim_ids
    assert "VC" in victim_ids

@pytest.mark.asyncio
async def test_fire_spread_changes_environment(manager):
    sim_id = manager.create_simulation("scenario_05")
    session = manager.get_simulation(sim_id)
    session.initialize()
    
    fire_hazard = next((h for h in session.env.hazards.values()), None)
    assert fire_hazard is not None
    initial_fire_cells = len(fire_hazard.affected_cells)
    
    # Run enough ticks for fire to spread
    for _ in range(20):
        await session.step_once()
    
    final_fire_cells = len(fire_hazard.affected_cells)
    assert final_fire_cells >= initial_fire_cells  # Fire should not shrink

@pytest.mark.asyncio
async def test_metrics_calculation(manager):
    sim_id = manager.create_simulation("demo")
    session = manager.get_simulation(sim_id)
    session.initialize()
    
    metrics = session.get_metrics()
    assert "total_victims" in metrics
    assert metrics["total_victims"] == 3
    assert "mission_score" in metrics
    assert 0 <= metrics["mission_score"] <= 100

@pytest.mark.asyncio
async def test_competition_demo_replans_after_fire_and_rescues_all(manager):
    sim_id = manager.create_simulation("demo")
    session = manager.get_simulation(sim_id)
    session.initialize()

    for _ in range(180):
        await session.step_once()
        if session.env.robot.status == RobotStatus.COMPLETED:
            break

    event_types = [event.event_type for event in session.all_events]
    required = [
        EventType.DECISION_CREATED,
        EventType.PATH_PLANNED,
        EventType.FIRE_SPREAD,
        EventType.PATH_INVALIDATED,
        EventType.REPLAN_TRIGGERED,
        EventType.VICTIM_RESCUED,
        EventType.RESCUE_COMPLETED,
        EventType.MISSION_COMPLETED,
    ]
    positions = [event_types.index(event_type) for event_type in required]
    assert positions == sorted(positions)
    assert session.env.robot.victims_rescued == 3
    assert session.env.robot.replans_count >= 1
    assert session.get_metrics()["mission_completion_rate"] == 100.0

@pytest.mark.asyncio
async def test_path_invalidated_while_moving_logs_decision_history(manager):
    sim_id = manager.create_simulation("scenario_05")
    session = manager.get_simulation(sim_id)
    session.initialize()
    robot = session.env.robot

    robot.position = Position(1, 1)
    robot.status = RobotStatus.MOVING
    robot.current_target = "V01"
    robot.current_path = [Position(1, 1), Position(2, 1), Position(3, 1)]
    robot.path_index = 0
    robot.current_action = ActionType.MOVE_TO_TARGET
    session.env.set_cell_type(Position(2, 1), CellType.WALL)

    await session.step_once()

    assert session.decision_engine is not None
    assert any(
        entry["selected_action"] == "REPLAN"
        for entry in session.decision_engine.decision_history
    )
    explanation = next(
        entry["explanation"]
        for entry in session.decision_engine.decision_history
        if entry["selected_action"] == "REPLAN"
    )
    assert "blocked" in explanation.lower() or "invalidated" in explanation.lower()
    assert robot.replans_count >= 1


@pytest.mark.asyncio
async def test_walled_off_victim_never_rescued(manager):
    sim_id = manager.create_simulation("scenario_01")
    session = manager.get_simulation(sim_id)
    session.initialize()
    env = session.env
    robot = env.robot
    robot.position = Position(1, 1)
    robot.status = RobotStatus.IDLE
    robot.current_target = None
    robot.current_path = []
    robot.path_index = 0
    robot.current_action = None

    for y in range(env.rows):
        env.set_cell_type(Position(5, y), CellType.WALL)
        env.set_cell_type(Position(6, y), CellType.WALL)

    victim = VictimState(
        id="V_BLOCKED",
        position=Position(8, 8),
        severity=Severity.CRITICAL,
        health=80,
        urgency=0.9,
        age=30,
        injury_type=InjuryType.TRAUMA,
        mobility_status=MobilityStatus.IMMOBILE,
        time_since_incident=10,
        hazard_exposure=0.0,
    )
    env.add_victim(victim)

    engine = DecisionEngine(env)
    for _ in range(10):
        decision = engine.make_decision(robot)
        assert decision.action != ActionType.RESCUE_VICTIM
        assert robot.position != victim.position
        assert not victim.rescued
        if decision.action in (ActionType.COMPLETE_MISSION, ActionType.RETURN_TO_BASE):
            break

    assert not victim.rescued
    assert robot.position != victim.position


@pytest.mark.asyncio
async def test_average_rescue_time_uses_incident_start_tick():
    victim = VictimState(
        id="V07",
        position=Position(2, 2),
        severity=Severity.HIGH,
        health=50,
        urgency=0.8,
        age=20,
        injury_type=InjuryType.TRAUMA,
        mobility_status=MobilityStatus.MOBILE,
        time_since_incident=4,
        hazard_exposure=0.1,
        incident_start_tick=5,
        rescue_time=25,
        rescued=True,
    )
    robot = RobotState(
        id="R01", position=Position(1, 1), battery=100.0, max_battery=100.0,
        speed=1.0, status=RobotStatus.IDLE, base_position=Position(1, 1)
    )
    metrics = MetricsEngine().calculate({victim.id: victim}, robot, [], 30, "case")
    assert metrics["average_rescue_time"] == 20.0


@pytest.mark.asyncio
async def test_dynamic_fire_cannot_leave_robot_in_infinite_replanning(manager):
    sim_id = manager.create_simulation("scenario_05")
    session = manager.get_simulation(sim_id)
    session.initialize()

    for _ in range(500):
        await session.step_once()
        if session.env.robot.status in (RobotStatus.COMPLETED, RobotStatus.ABORTED):
            break

    assert session.env.robot.status in (RobotStatus.COMPLETED, RobotStatus.ABORTED)
    assert session.env.robot.status != RobotStatus.REPLANNING
