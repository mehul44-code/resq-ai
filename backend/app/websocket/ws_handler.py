from fastapi import WebSocket, WebSocketDisconnect
from app.services.simulation.simulation_manager import simulation_manager
from app.services.simulation.types import SimEvent
from app.core.logging_config import logger
import json

async def websocket_endpoint(websocket: WebSocket, sim_id: str):
    await websocket.accept()
    logger.info(f"WebSocket connected for simulation {sim_id}")
    
    session = simulation_manager.get_simulation(sim_id)
    if not session:
        await websocket.send_json({"error": f"Simulation {sim_id} not found"})
        await websocket.close()
        return
    
    # Send current state immediately
    try:
        await websocket.send_json({
            "type": "connected",
            "simulation_id": sim_id,
            "state": session.get_state()
        })
    except Exception:
        return
    
    async def send_event(event: SimEvent):
        try:
            await websocket.send_json({
                "type": event.event_type.value,
                "tick": event.tick,
                "timestamp": event.timestamp,
                "data": event.data
            })
        except Exception:
            pass
    
    session.add_event_callback(send_event)
    
    try:
        while True:
            # Handle incoming messages from frontend
            try:
                msg = await websocket.receive_json()
                action = msg.get("action")
                
                if action == "ping":
                    await websocket.send_json({"type": "pong"})
                elif action == "get_state":
                    await websocket.send_json({"type": "state", "data": session.get_state()})
                elif action == "inject_event":
                    session.inject_event(msg.get("event_type", ""), msg.get("data", {}))
            except Exception:
                break
    except WebSocketDisconnect:
        pass
    finally:
        session.remove_event_callback(send_event)
        logger.info(f"WebSocket disconnected for simulation {sim_id}")
