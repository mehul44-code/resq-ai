from typing import Optional
from app.services.simulation.types import (
    RobotState, VictimState, RobotStatus, ActionType, Position, EventType, SimEvent
)
from app.services.simulation.environment import DisasterEnvironment
from app.core.config import settings
from app.core.logging_config import logger
import datetime

DEFAULT_RESCUE_TICKS = 5

class RobotController:
    def __init__(self, env: DisasterEnvironment):
        self.env = env
    
    def execute_action(self, robot: RobotState, action: ActionType) -> list:
        """Execute one tick of robot action. Returns list of new events."""
        events = []
        
        if action == ActionType.MOVE_TO_TARGET or action == ActionType.RETURN_TO_BASE:
            events.extend(self._execute_move(robot))
        elif action == ActionType.RESCUE_VICTIM:
            events.extend(self._execute_rescue(robot))
        elif action == ActionType.CHARGE:
            events.extend(self._execute_charge(robot))
        elif action == ActionType.REPLAN:
            robot.status = RobotStatus.REPLANNING
        
        # Consume battery each tick
        if action in (ActionType.MOVE_TO_TARGET, ActionType.RETURN_TO_BASE, ActionType.RESCUE_VICTIM):
            old_battery = robot.battery
            if action == ActionType.RESCUE_VICTIM:
                robot.battery = max(0, robot.battery - settings.RESCUE_BATTERY_COST / DEFAULT_RESCUE_TICKS)
            else:
                robot.battery = max(0, robot.battery - settings.MOVEMENT_BATTERY_COST)
            robot.battery_consumed += old_battery - robot.battery
            
            events.append(SimEvent(
                event_type=EventType.BATTERY_UPDATED,
                tick=self.env.tick,
                timestamp=datetime.datetime.now().isoformat(),
                data={"battery": robot.battery, "consumed": robot.battery_consumed},
                simulation_id=self.env.simulation_id
            ))
        
        return events
    
    def _execute_move(self, robot: RobotState) -> list:
        events = []
        
        if not robot.current_path or robot.path_index >= len(robot.current_path):
            # Reached destination
            if robot.status == RobotStatus.RETURNING_TO_BASE:
                robot.status = RobotStatus.CHARGING
                robot.position = robot.base_position
                events.append(self._make_event(EventType.ROBOT_RETURNED_BASE, robot, {}))
            elif robot.current_target:
                # Arrived at victim
                robot.status = RobotStatus.RESCUING
                robot.rescue_ticks_remaining = DEFAULT_RESCUE_TICKS
                robot.current_action = ActionType.RESCUE_VICTIM
                events.append(self._make_event(EventType.ROBOT_MOVED, robot, {"arrived_at_target": True}))
            return events
        
        next_pos = robot.current_path[robot.path_index]
        
        # Check if next position is still passable
        cell = self.env.get_cell(next_pos)
        if cell and not cell.is_passable:
            # Blocked! Need replan
            robot.status = RobotStatus.REPLANNING
            robot.path_index = 0
            robot.current_path = []
            events.append(self._make_event(EventType.PATH_INVALIDATED, robot, {
                "blocked_at": {"x": next_pos.x, "y": next_pos.y}
            }))
            return events
        
        # Move
        robot.position = next_pos
        robot.path_index += 1
        robot.total_distance += 1
        
        events.append(self._make_event(EventType.ROBOT_MOVED, robot, {
            "position": {"x": robot.position.x, "y": robot.position.y},
            "path_index": robot.path_index
        }))
        
        return events
    
    def _execute_rescue(self, robot: RobotState) -> list:
        events = []
        robot.rescue_ticks_remaining -= 1
        
        if robot.rescue_ticks_remaining <= 0:
            # Rescue complete
            if robot.current_target and robot.current_target in self.env.victims:
                victim = self.env.victims[robot.current_target]
                victim.rescued = True
                victim.rescue_time = self.env.tick
                
                # Clear victim from cell
                cell = self.env.get_cell(victim.position)
                if cell:
                    cell.victim_id = None
                
                robot.victims_rescued += 1
                robot.status = RobotStatus.SELECTING_TARGET
                robot.current_target = None
                robot.current_path = []
                robot.path_index = 0
                robot.current_action = None
                
                events.append(self._make_event(EventType.VICTIM_RESCUED, robot, {
                    "victim_id": victim.id,
                    "rescue_time": victim.rescue_time,
                    "health_at_rescue": victim.health
                }))
                events.append(self._make_event(EventType.RESCUE_COMPLETED, robot, {
                    "victim_id": victim.id,
                    "total_rescued": robot.victims_rescued
                }))
        
        return events
    
    def _execute_charge(self, robot: RobotState) -> list:
        events = []
        charge_rate = 10.0
        robot.battery = min(robot.max_battery, robot.battery + charge_rate)
        
        if robot.battery >= robot.max_battery * 0.9:
            robot.status = RobotStatus.IDLE
            robot.current_action = None
            events.append(self._make_event(EventType.CHARGING_COMPLETED, robot, {"battery": robot.battery}))
        
        return events
    
    def _make_event(self, event_type: EventType, robot: RobotState, extra_data: dict) -> SimEvent:
        return SimEvent(
            event_type=event_type,
            tick=self.env.tick,
            timestamp=datetime.datetime.now().isoformat(),
            data={"robot_id": robot.id, **extra_data},
            simulation_id=self.env.simulation_id
        )
