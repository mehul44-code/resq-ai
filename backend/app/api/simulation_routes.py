from fastapi import APIRouter, HTTPException, Depends
from app.schemas.simulation import (
    CreateSimulationRequest, SimulationResponse, InjectEventRequest,
    ScenarioMeta, MetricsResponse
)
from app.services.simulation.simulation_manager import simulation_manager
from app.services.simulation.scenario_loader import SCENARIOS

router = APIRouter(prefix="/api", tags=["simulation"])

@router.get("/health")
async def health():
    return {"status": "ok", "service": "ResQ-AI Backend"}

@router.get("/scenarios")
async def list_scenarios():
    return [
        ScenarioMeta(
            id=v["id"], name=v["name"], description=v["description"],
            difficulty=v["difficulty"], grid_cols=v["grid_cols"], grid_rows=v["grid_rows"]
        )
        for v in SCENARIOS.values()
    ]

@router.get("/scenarios/{scenario_id}")
async def get_scenario(scenario_id: str):
    meta = SCENARIOS.get(scenario_id)
    if not meta:
        raise HTTPException(status_code=404, detail=f"Scenario {scenario_id} not found")
    return meta

@router.post("/simulations")
async def create_simulation(req: CreateSimulationRequest):
    if req.scenario_id not in SCENARIOS:
        raise HTTPException(status_code=400, detail=f"Unknown scenario: {req.scenario_id}")
    sim_id = simulation_manager.create_simulation(req.scenario_id)
    session = simulation_manager.get_simulation(sim_id)
    session.initialize()
    return SimulationResponse(id=sim_id, scenario_id=req.scenario_id, status="IDLE")

@router.get("/simulations")
async def list_simulations():
    return simulation_manager.list_simulations()

@router.get("/simulations/{sim_id}")
async def get_simulation(sim_id: str):
    session = simulation_manager.get_simulation(sim_id)
    if not session:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return {"id": sim_id, "scenario_id": session.scenario_id, "status": session.status.value, "tick": session.env.tick if session.env else 0}

@router.post("/simulations/{sim_id}/start")
async def start_simulation(sim_id: str):
    session = simulation_manager.get_simulation(sim_id)
    if not session:
        raise HTTPException(status_code=404, detail="Simulation not found")
    await session.start()
    return {"status": "started"}

@router.post("/simulations/{sim_id}/pause")
async def pause_simulation(sim_id: str):
    session = simulation_manager.get_simulation(sim_id)
    if not session:
        raise HTTPException(status_code=404, detail="Simulation not found")
    await session.pause()
    return {"status": "paused"}

@router.post("/simulations/{sim_id}/resume")
async def resume_simulation(sim_id: str):
    session = simulation_manager.get_simulation(sim_id)
    if not session:
        raise HTTPException(status_code=404, detail="Simulation not found")
    await session.resume()
    return {"status": "resumed"}

@router.post("/simulations/{sim_id}/reset")
async def reset_simulation(sim_id: str):
    session = simulation_manager.get_simulation(sim_id)
    if not session:
        raise HTTPException(status_code=404, detail="Simulation not found")
    await session.reset()
    return {"status": "reset"}

@router.post("/simulations/{sim_id}/step")
async def step_simulation(sim_id: str):
    session = simulation_manager.get_simulation(sim_id)
    if not session:
        raise HTTPException(status_code=404, detail="Simulation not found")
    await session.step_once()
    return {"status": "stepped", "tick": session.env.tick if session.env else 0}

@router.get("/simulations/{sim_id}/state")
async def get_simulation_state(sim_id: str):
    session = simulation_manager.get_simulation(sim_id)
    if not session:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return session.get_state()

@router.get("/simulations/{sim_id}/events")
async def get_simulation_events(sim_id: str, limit: int = 50):
    session = simulation_manager.get_simulation(sim_id)
    if not session:
        raise HTTPException(status_code=404, detail="Simulation not found")
    events = session.all_events[-limit:]
    return [{
        "event_type": e.event_type.value,
        "tick": e.tick,
        "timestamp": e.timestamp,
        "data": e.data
    } for e in events]

@router.get("/simulations/{sim_id}/decisions")
async def get_simulation_decisions(sim_id: str, limit: int = 50):
    session = simulation_manager.get_simulation(sim_id)
    if not session:
        raise HTTPException(status_code=404, detail="Simulation not found")
    if session.decision_engine:
        return session.decision_engine.decision_history[-limit:]
    return []

@router.get("/simulations/{sim_id}/metrics")
async def get_simulation_metrics(sim_id: str):
    session = simulation_manager.get_simulation(sim_id)
    if not session:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return session.get_metrics()

@router.post("/simulations/{sim_id}/inject-event")
async def inject_event(sim_id: str, req: InjectEventRequest):
    session = simulation_manager.get_simulation(sim_id)
    if not session:
        raise HTTPException(status_code=404, detail="Simulation not found")
    session.inject_event(req.event_type, req.data)
    return {"status": "event injected"}
