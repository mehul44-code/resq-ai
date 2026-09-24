from typing import Optional, List
from app.services.simulation.types import (
    RobotState, VictimState, PathResult, ReasonCode, PathOutcome, Position, CellType
)
from app.services.simulation.environment import DisasterEnvironment
from app.core.config import settings

class SafetyEngine:
    def check_route_safety(self, path: PathResult, env: DisasterEnvironment) -> tuple[bool, List[str]]:
        """Returns (is_safe, list of violation reasons)"""
        violations = []
        
        if not path.path:
            return False, ["No path available"]
        
        for pos in path.path:
            cell = env.get_cell(pos)
            if cell:
                if cell.fire_intensity > 0.5:
                    violations.append(f"Route passes through active fire at ({pos.x},{pos.y})")
                if not cell.is_passable:
                    violations.append(f"Route passes through impassable cell at ({pos.x},{pos.y})")
        
        return len(violations) == 0, violations
    
    def check_battery_safety(self, robot: RobotState, battery_required: float) -> tuple[bool, str]:
        """Returns (is_safe, reason)"""
        available = robot.battery - settings.BATTERY_RESERVE_THRESHOLD
        if battery_required > available:
            return False, f"Insufficient battery: need {battery_required:.1f}, have {available:.1f} (reserve: {settings.BATTERY_RESERVE_THRESHOLD})"
        return True, "Battery sufficient"
    
    def should_return_to_base(self, robot: RobotState, path_to_base_cost: float) -> tuple[bool, str]:
        """Check if robot must return to base immediately"""
        battery_for_return = path_to_base_cost + settings.BATTERY_RESERVE_THRESHOLD
        if robot.battery <= battery_for_return:
            return True, f"Battery {robot.battery:.1f}% requires immediate return (need {battery_for_return:.1f}% for safe return)"
        return False, ""
    
    def check_path_still_valid(self, path: List[Position], env: DisasterEnvironment) -> tuple[bool, List[Position]]:
        """Check if a previously planned path is still valid"""
        unsafe_positions = []
        for pos in path:
            cell = env.get_cell(pos)
            if cell and not cell.is_passable:
                unsafe_positions.append(pos)
        return len(unsafe_positions) == 0, unsafe_positions
    
    def check_emergency_conditions(self, robot: RobotState, env: DisasterEnvironment) -> tuple[bool, str]:
        """Check if robot is in an immediate danger zone"""
        cell = env.get_cell(robot.position)
        if cell:
            if cell.fire_intensity > 0.7:
                return True, f"Robot is in high-intensity fire zone at ({robot.position.x},{robot.position.y})"
            if cell.hazard_level > 0.8:
                return True, f"Robot is in extreme hazard zone at ({robot.position.x},{robot.position.y})"
        return False, ""
