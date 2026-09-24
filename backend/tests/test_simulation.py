import pytest
import asyncio
from app.services.simulation.simulation_manager import SimulationManager
from app.services.simulation.types import EventType, SimulationStatus, RobotStatus

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
