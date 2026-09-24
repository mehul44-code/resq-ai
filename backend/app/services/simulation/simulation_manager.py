import asyncio
import uuid
import datetime
from typing import Dict, List, Optional, Callable
from app.services.simulation.types import (
    SimulationStatus, RobotStatus, ActionType, EventType, SimEvent, ReasonCode
)
from app.services.simulation.environment import DisasterEnvironment
from app.services.simulation.scenario_loader import build_scenario, SCENARIOS
from app.services.agent.decision_engine import DecisionEngine
from app.services.agent.robot_controller import RobotController
from app.services.metrics.metrics_engine import MetricsEngine
from app.core.config import settings
from app.core.logging_config import logger

class SimulationManager:
    def __init__(self):
        self.simulations: Dict[str, 'SimulationSession'] = {}
    
    def create_simulation(self, scenario_id: str) -> str:
        sim_id = str(uuid.uuid4())
        meta = SCENARIOS.get(scenario_id, {})
        session = SimulationSession(
            sim_id=sim_id,
            scenario_id=scenario_id,
            tick_interval_ms=meta.get("tick_interval_ms", settings.DEFAULT_TICK_INTERVAL_MS)
        )
        self.simulations[sim_id] = session
        return sim_id
    
    def get_simulation(self, sim_id: str) -> Optional['SimulationSession']:
        return self.simulations.get(sim_id)
    
    def list_simulations(self) -> List[dict]:
        return [
            {"id": sid, "scenario_id": s.scenario_id, "status": s.status.value, "tick": s.env.tick if s.env else 0}
            for sid, s in self.simulations.items()
        ]

class SimulationSession:
    def __init__(self, sim_id: str, scenario_id: str, tick_interval_ms: int = 500):
        self.sim_id = sim_id
        self.scenario_id = scenario_id
        self.tick_interval_ms = tick_interval_ms
        self.status: SimulationStatus = SimulationStatus.IDLE
        self.env: Optional[DisasterEnvironment] = None
        self.decision_engine: Optional[DecisionEngine] = None
        self.robot_controller: Optional[RobotController] = None
        self.metrics_engine = MetricsEngine()
        self._task: Optional[asyncio.Task] = None
        self._event_callbacks: List[Callable] = []
        self.all_events: List[SimEvent] = []
        self.started_at: Optional[str] = None
        self._replan_pending = False
    
    def add_event_callback(self, callback: Callable):
        self._event_callbacks.append(callback)
    
    def remove_event_callback(self, callback: Callable):
        if callback in self._event_callbacks:
            self._event_callbacks.remove(callback)
    
    async def _broadcast_events(self, events: List[SimEvent]):
        for event in events:
            self.all_events.append(event)
            for cb in self._event_callbacks:
                try:
                    await cb(event)
                except Exception as e:
                    logger.warning(f"Event callback error: {e}")
    
    def initialize(self):
        self.env = build_scenario(self.scenario_id, self.sim_id)
        self.decision_engine = DecisionEngine(self.env)
        self.robot_controller = RobotController(self.env)
        self.all_events = []
        logger.info(f"Simulation {self.sim_id} initialized with scenario {self.scenario_id}")
    
    async def start(self):
        if self.status == SimulationStatus.RUNNING:
            return
        if self.env is None:
            self.initialize()
        
        self.status = SimulationStatus.RUNNING
        self.started_at = datetime.datetime.now().isoformat()
        
        start_event = SimEvent(
            event_type=EventType.SIMULATION_STARTED,
            tick=0,
            timestamp=self.started_at,
            data={"simulation_id": self.sim_id, "scenario_id": self.scenario_id},
            simulation_id=self.sim_id
        )
        detected_events = [
            SimEvent(
                event_type=EventType.VICTIM_DETECTED,
                tick=0,
                timestamp=self.started_at,
                data={"victim_id": victim.id, "severity": victim.severity.value},
                simulation_id=self.sim_id,
            )
            for victim in self.env.victims.values()
        ]
        await self._broadcast_events([start_event, *detected_events])
        
        self._task = asyncio.create_task(self._run_loop())
        logger.info(f"Simulation {self.sim_id} started")
    
    async def pause(self):
        if self.status == SimulationStatus.RUNNING:
            self.status = SimulationStatus.PAUSED
            logger.info(f"Simulation {self.sim_id} paused at tick {self.env.tick if self.env else 0}")
    
    async def resume(self):
        if self.status == SimulationStatus.PAUSED:
            self.status = SimulationStatus.RUNNING
            logger.info(f"Simulation {self.sim_id} resumed")
    
    async def reset(self):
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        self.status = SimulationStatus.IDLE
        self.initialize()
        logger.info(f"Simulation {self.sim_id} reset")
    
    async def step_once(self):
        """Execute exactly one tick."""
        if self.env and self.status in (SimulationStatus.IDLE, SimulationStatus.PAUSED):
            await self._execute_tick()
    
    async def _run_loop(self):
        try:
            while self.status == SimulationStatus.RUNNING:
                if self.env.tick >= settings.MAX_TICKS:
                    self.status = SimulationStatus.COMPLETED
                    break
                
                robot = self.env.robot
                if robot and robot.status in (RobotStatus.COMPLETED, RobotStatus.ABORTED):
                    self.status = SimulationStatus.COMPLETED
                    if not any(event.event_type == EventType.MISSION_COMPLETED for event in self.all_events):
                        await self._broadcast_events([SimEvent(
                            event_type=EventType.MISSION_COMPLETED,
                            tick=self.env.tick,
                            timestamp=datetime.datetime.now().isoformat(),
                            data=self.get_metrics(),
                            simulation_id=self.sim_id
                        )])
                    break
                
                await self._execute_tick()
                await asyncio.sleep(self.tick_interval_ms / 1000.0)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Simulation loop error: {e}", exc_info=True)
            self.status = SimulationStatus.ABORTED
    
    async def _execute_tick(self):
        """Execute one complete simulation tick."""
        env = self.env
        robot = env.robot
        events = []
        
        # 1. Environment update (fire spread, victim health)
        env_events = env.tick_update()
        events.extend(env_events)
        
        # 2. AI decision (check if replan needed or decide next action)
        if robot:
            if robot.status in (RobotStatus.IDLE, RobotStatus.SELECTING_TARGET,
                                RobotStatus.REPLANNING, RobotStatus.ASSESSING):
                decision = self.decision_engine.make_decision(robot)
                robot.current_action = decision.action
                
                events.append(SimEvent(
                    event_type=EventType.DECISION_CREATED,
                    tick=env.tick,
                    timestamp=datetime.datetime.now().isoformat(),
                    data={
                        "action": decision.action.value,
                        "target": decision.target,
                        "score": decision.score,
                        "reason_codes": [rc.value for rc in decision.reason_codes],
                        "explanation": decision.explanation,
                        "replan_required": decision.replan_required,
                        "path": [{"x": p.x, "y": p.y} for p in (decision.path_result.path if decision.path_result else [])]
                    },
                    simulation_id=self.sim_id
                ))
                if decision.candidate_evaluations and not any(
                    event.event_type == EventType.TRIAGE_COMPLETED for event in self.all_events
                ):
                    events.append(SimEvent(
                        event_type=EventType.TRIAGE_COMPLETED,
                        tick=env.tick,
                        timestamp=datetime.datetime.now().isoformat(),
                        data={"candidate_count": len(decision.candidate_evaluations)},
                        simulation_id=self.sim_id,
                    ))
                if decision.path_result and decision.path_result.path:
                    events.append(SimEvent(
                        event_type=EventType.PATH_PLANNED,
                        tick=env.tick,
                        timestamp=datetime.datetime.now().isoformat(),
                        data={
                            "target": decision.target,
                            "path_length": len(decision.path_result.path),
                            "outcome": decision.path_result.outcome.value,
                        },
                        simulation_id=self.sim_id,
                    ))
                if ReasonCode.REPLAN_TRIGGERED.value in [code.value for code in decision.reason_codes]:
                    events.append(SimEvent(
                        event_type=EventType.REPLAN_TRIGGERED,
                        tick=env.tick,
                        timestamp=datetime.datetime.now().isoformat(),
                        data={"reason": decision.explanation, "target": decision.target},
                        simulation_id=self.sim_id,
                    ))
                
                if decision.action == ActionType.COMPLETE_MISSION:
                    self.status = SimulationStatus.COMPLETED
                    events.append(SimEvent(
                        event_type=EventType.MISSION_COMPLETED,
                        tick=env.tick,
                        timestamp=datetime.datetime.now().isoformat(),
                        data=self.get_metrics(),
                        simulation_id=self.sim_id,
                    ))
            
            elif robot.status == RobotStatus.MOVING:
                # Check if path still valid (fire may have spread)
                if robot.current_path:
                    remaining = robot.current_path[robot.path_index:]
                    path_valid, unsafe = self.env.check_path_safety(remaining)
                    if not unsafe:  # actually check unsafe list
                        pass
                    if unsafe:
                        robot.status = RobotStatus.REPLANNING
                        robot.previous_path = list(robot.current_path)
                        robot.replans_count += 1
                        events.append(SimEvent(
                            event_type=EventType.PATH_INVALIDATED,
                            tick=env.tick,
                            timestamp=datetime.datetime.now().isoformat(),
                            data={"unsafe_cells": [{"x": p.x, "y": p.y} for p in unsafe]},
                            simulation_id=self.sim_id
                        ))
                        events.append(SimEvent(
                            event_type=EventType.REPLAN_TRIGGERED,
                            tick=env.tick,
                            timestamp=datetime.datetime.now().isoformat(),
                            data={"reason": "path_blocked", "unsafe_cells": len(unsafe)},
                            simulation_id=self.sim_id
                        ))
            
            # 3. Execute robot action
            if robot.current_action and robot.status not in (
                RobotStatus.COMPLETED, RobotStatus.ABORTED, RobotStatus.REPLANNING
            ):
                action_events = self.robot_controller.execute_action(robot, robot.current_action)
                events.extend(action_events)
                if any(event.event_type == EventType.VICTIM_RESCUED for event in action_events):
                    events.append(SimEvent(
                        event_type=EventType.MISSION_REASSESSMENT,
                        tick=env.tick,
                        timestamp=datetime.datetime.now().isoformat(),
                        data={"remaining_victims": sum(
                            1 for victim in env.victims.values() if not victim.rescued
                        )},
                        simulation_id=self.sim_id,
                    ))
            
            # 4. Check charging
            if robot.status == RobotStatus.CHARGING:
                charge_events = self.robot_controller.execute_action(robot, ActionType.CHARGE)
                events.extend(charge_events)
        
        # Broadcast all events
        events.append(SimEvent(
            event_type=EventType.TICK_UPDATED,
            tick=env.tick,
            timestamp=datetime.datetime.now().isoformat(),
            data=self.get_state(),
            simulation_id=self.sim_id
        ))
        
        await self._broadcast_events(events)
    
    def get_state(self) -> dict:
        if not self.env:
            return {}
        state = self.env.get_state_snapshot()
        state["simulation_id"] = self.sim_id
        state["scenario_id"] = self.scenario_id
        state["status"] = self.status.value
        state["decision_history"] = self.decision_engine.decision_history[-10:] if self.decision_engine else []
        return state
    
    def get_metrics(self) -> dict:
        if not self.env:
            return {}
        meta = SCENARIOS.get(self.scenario_id, {})
        return self.metrics_engine.calculate(
            self.env.victims,
            self.env.robot,
            self.all_events,
            self.env.tick,
            meta.get("name", self.scenario_id)
        )
    
    def inject_event(self, event_type: str, data: dict):
        """Inject external events like fire, blocked routes, etc."""
        if not self.env:
            return
        
        if event_type == "trigger_fire":
            x, y = data.get("x", 10), data.get("y", 10)
            from app.services.simulation.types import HazardState, HazardType, Position
            hazard_id = f"H_INJECTED_{self.env.tick}"
            h = HazardState(
                id=hazard_id, hazard_type=HazardType.FIRE,
                position=Position(x, y), intensity=0.9,
                spread_rate=0.4, spread_interval=6,
                affected_cells=[Position(x, y)]
            )
            self.env.add_hazard(h)
            logger.info(f"Injected fire at ({x},{y})")
        
        elif event_type == "block_route":
            x, y = data.get("x", 10), data.get("y", 10)
            from app.services.simulation.types import CellType, Position
            self.env.set_cell_type(Position(x, y), CellType.BLOCKED)
            logger.info(f"Blocked route at ({x},{y})")
        
        elif event_type == "set_battery":
            if self.env.robot:
                self.env.robot.battery = float(data.get("battery", 50))
        
        elif event_type == "add_victim":
            from app.services.simulation.types import VictimState, Severity, InjuryType, MobilityStatus, Position
            x, y = data.get("x", 15), data.get("y", 10)
            vid = f"V_INJ_{self.env.tick}"
            v = VictimState(
                id=vid, position=Position(x, y),
                severity=Severity(data.get("severity", "MEDIUM")),
                health=float(data.get("health", 70)),
                urgency=float(data.get("urgency", 0.5)),
                age=30, injury_type=InjuryType.TRAUMA,
                mobility_status=MobilityStatus.IMMOBILE,
                time_since_incident=0, hazard_exposure=0.0
            )
            self.env.add_victim(v)

# Global manager instance
simulation_manager = SimulationManager()
