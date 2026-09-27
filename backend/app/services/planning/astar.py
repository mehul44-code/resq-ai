import heapq
from typing import List, Optional, Dict, Tuple
from app.services.simulation.types import Position, PathResult, PathOutcome, GridCell
from app.services.simulation.environment import DisasterEnvironment
from app.core.config import settings

class AStarPlanner:
    FIRE_PENALTY = 1000.0
    SMOKE_PENALTY = 3.0
    DANGEROUS_ZONE_PENALTY = 5.0
    HAZARD_PENALTY = 4.0
    HIGH_RISK_THRESHOLD = 20.0
    
    def __init__(self, environment: DisasterEnvironment):
        self.env = environment
    
    def heuristic(self, a: Position, b: Position) -> float:
        return abs(a.x - b.x) + abs(a.y - b.y)
    
    def get_cell_cost(self, pos: Position) -> float:
        cell = self.env.get_cell(pos)
        if cell is None:
            return float('inf')
        if not cell.is_passable:
            return float('inf')
        
        cost = 1.0 * cell.movement_cost_multiplier
        cost += cell.fire_intensity * self.FIRE_PENALTY
        cost += cell.smoke_density * self.SMOKE_PENALTY
        cost += cell.hazard_level * self.HAZARD_PENALTY
        
        from app.services.simulation.types import CellType
        if cell.cell_type == CellType.DANGEROUS_ZONE:
            cost += self.DANGEROUS_ZONE_PENALTY
        
        return cost
    
    def find_path(self, start: Position, goal: Position, battery_available: float = float('inf')) -> PathResult:
        # Start cells can be temporarily impassable (for example, the robot standing in a fire zone).
        # The search should still begin from the current location and consider neighbor expansion rather
        # than rejecting the route upfront with a dead no-op check.
        goal_cell = self.env.get_cell(goal)
        if goal_cell is None:
            return PathResult(outcome=PathOutcome.TARGET_UNREACHABLE, path=[], cost=float('inf'),
                            risk_score=1.0, estimated_ticks=0, start=start, goal=goal,
                            reason="Goal position out of bounds")
        
        open_set = []
        heapq.heappush(open_set, (0.0, 0, start))
        came_from: Dict[Tuple[int,int], Position] = {}
        g_score: Dict[Tuple[int,int], float] = {start.to_tuple(): 0.0}
        f_score: Dict[Tuple[int,int], float] = {start.to_tuple(): self.heuristic(start, goal)}
        counter = 1
        
        while open_set:
            _, _, current = heapq.heappop(open_set)
            
            if current == goal:
                path = self._reconstruct_path(came_from, current)
                total_cost = g_score[current.to_tuple()]
                risk_score = self._calculate_risk(path)
                battery_needed = len(path) * settings.MOVEMENT_BATTERY_COST
                
                if total_cost > self.HIGH_RISK_THRESHOLD * len(path):
                    outcome = PathOutcome.HIGH_RISK_PATH
                elif battery_needed > battery_available:
                    outcome = PathOutcome.NO_SAFE_PATH
                    return PathResult(outcome=outcome, path=path, cost=total_cost,
                                    risk_score=risk_score, estimated_ticks=len(path),
                                    start=start, goal=goal,
                                    reason="Insufficient battery for this route",
                                    battery_required=battery_needed)
                elif risk_score > 0.6:
                    outcome = PathOutcome.HIGH_RISK_PATH
                elif total_cost > len(path) * 3:
                    outcome = PathOutcome.SAFE_BUT_EXPENSIVE
                else:
                    outcome = PathOutcome.SAFE_PATH_FOUND
                
                return PathResult(outcome=outcome, path=path, cost=total_cost,
                                risk_score=risk_score, estimated_ticks=len(path),
                                start=start, goal=goal, battery_required=battery_needed)
            
            for neighbor in self.env.get_neighbors(current):
                cell = self.env.get_cell(neighbor)
                if cell is None:
                    continue
                
                cell_cost = self.get_cell_cost(neighbor)
                if cell_cost == float('inf'):
                    continue
                
                tentative_g = g_score.get(current.to_tuple(), float('inf')) + cell_cost
                
                if tentative_g < g_score.get(neighbor.to_tuple(), float('inf')):
                    came_from[neighbor.to_tuple()] = current
                    g_score[neighbor.to_tuple()] = tentative_g
                    f = tentative_g + self.heuristic(neighbor, goal)
                    f_score[neighbor.to_tuple()] = f
                    heapq.heappush(open_set, (f, counter, neighbor))
                    counter += 1
        
        return PathResult(outcome=PathOutcome.TARGET_UNREACHABLE, path=[], cost=float('inf'),
                        risk_score=1.0, estimated_ticks=0, start=start, goal=goal,
                        reason="No path found to target")
    
    def _reconstruct_path(self, came_from: Dict, current: Position) -> List[Position]:
        path = [current]
        while current.to_tuple() in came_from:
            current = came_from[current.to_tuple()]
            path.append(current)
        path.reverse()
        return path
    
    def _calculate_risk(self, path: List[Position]) -> float:
        if not path:
            return 1.0
        total_risk = 0.0
        for pos in path:
            cell = self.env.get_cell(pos)
            if cell:
                total_risk += cell.fire_intensity * 0.8 + cell.hazard_level * 0.5 + cell.smoke_density * 0.2
        return min(1.0, total_risk / max(1, len(path)))
    
    def estimate_battery_for_trip(self, start: Position, goal: Position, return_to_base: Position) -> float:
        """Estimate total battery needed: to victim + rescue + to base"""
        path_to_victim = self.find_path(start, goal)
        path_to_base = self.find_path(goal, return_to_base)
        
        travel_cost = len(path_to_victim.path) * settings.MOVEMENT_BATTERY_COST
        rescue_cost = settings.RESCUE_BATTERY_COST
        return_cost = len(path_to_base.path) * settings.MOVEMENT_BATTERY_COST
        reserve = settings.BATTERY_RESERVE_THRESHOLD
        
        return travel_cost + rescue_cost + return_cost + reserve
