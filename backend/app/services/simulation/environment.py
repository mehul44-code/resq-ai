import random
import copy
from typing import Optional, List, Dict, Set, Tuple
from dataclasses import dataclass, field
from app.services.simulation.types import (
    CellType, GridCell, Position, VictimState, HazardState, RobotState,
    RobotStatus, Severity, InjuryType, MobilityStatus, HazardType, SimEvent, EventType
)
import datetime

class DisasterEnvironment:
    def __init__(self, cols: int = 30, rows: int = 20, seed: int = 42):
        self.cols = cols
        self.rows = rows
        self.seed = seed
        self.rng = random.Random(seed)
        self.tick = 0
        self.grid: List[List[GridCell]] = []
        self.victims: Dict[str, VictimState] = {}
        self.hazards: Dict[str, HazardState] = {}
        self.robot: Optional[RobotState] = None
        self.events: List[SimEvent] = []
        self.simulation_id: str = ""
        self._initialize_grid()
    
    def _initialize_grid(self):
        self.grid = [
            [GridCell(x=x, y=y) for x in range(self.cols)]
            for y in range(self.rows)
        ]
    
    def get_cell(self, pos: Position) -> Optional[GridCell]:
        if 0 <= pos.x < self.cols and 0 <= pos.y < self.rows:
            return self.grid[pos.y][pos.x]
        return None
    
    def set_cell_type(self, pos: Position, cell_type: CellType):
        cell = self.get_cell(pos)
        if cell:
            cell.cell_type = cell_type
            cell.is_passable = cell_type not in (
                CellType.WALL, CellType.FIRE, CellType.BLOCKED
            )
    
    def is_passable(self, pos: Position) -> bool:
        cell = self.get_cell(pos)
        if cell is None:
            return False
        return cell.is_passable
    
    def get_neighbors(self, pos: Position) -> List[Position]:
        candidates = [
            Position(pos.x + 1, pos.y),
            Position(pos.x - 1, pos.y),
            Position(pos.x, pos.y + 1),
            Position(pos.x, pos.y - 1),
        ]
        return [p for p in candidates if 0 <= p.x < self.cols and 0 <= p.y < self.rows]
    
    def add_victim(self, victim: VictimState):
        self.victims[victim.id] = victim
        cell = self.get_cell(victim.position)
        if cell and not victim.rescued:
            cell.victim_id = victim.id
    
    def add_hazard(self, hazard: HazardState):
        self.hazards[hazard.id] = hazard
        for pos in hazard.affected_cells:
            cell = self.get_cell(pos)
            if cell:
                if hazard.hazard_type == HazardType.FIRE:
                    cell.cell_type = CellType.FIRE
                    cell.fire_intensity = hazard.intensity
                    cell.is_passable = False
                elif hazard.hazard_type == HazardType.SMOKE:
                    cell.smoke_density = hazard.intensity
                    cell.movement_cost_multiplier = 1.5
                elif hazard.hazard_type == HazardType.DANGEROUS_ZONE:
                    cell.cell_type = CellType.DANGEROUS_ZONE
                    cell.hazard_level = hazard.intensity
                    cell.movement_cost_multiplier = 2.0
    
    def update_fire_spread(self, hazard: HazardState) -> List[Position]:
        if hazard.max_spreads is not None and hazard.max_spreads <= 0:
            return []
        if self.tick - hazard.last_spread_tick < hazard.spread_interval:
            return []
        
        new_cells = []
        for pos in list(hazard.affected_cells):
            for neighbor in self.get_neighbors(pos):
                cell = self.get_cell(neighbor)
                if cell and cell.cell_type not in (
                    CellType.WALL, CellType.FIRE, CellType.BASE, CellType.CHARGING_STATION
                ):
                    if self.rng.random() < hazard.spread_rate:
                        new_cells.append(neighbor)
        
        for pos in new_cells:
            if pos not in hazard.affected_cells:
                hazard.affected_cells.append(pos)
                cell = self.get_cell(pos)
                if cell:
                    cell.cell_type = CellType.FIRE
                    cell.fire_intensity = hazard.intensity
                    cell.is_passable = False
        
        hazard.last_spread_tick = self.tick
        if hazard.max_spreads is not None:
            hazard.max_spreads -= 1
        return new_cells
    
    def tick_update(self) -> List[SimEvent]:
        self.tick += 1
        new_events = []
        
        # Update victims
        for vid, victim in self.victims.items():
            if victim.rescued:
                continue
            victim.time_since_incident += 1
            
            # Check hazard exposure
            cell = self.get_cell(victim.position)
            if cell:
                if cell.fire_intensity > 0:
                    victim.hazard_exposure = min(1.0, victim.hazard_exposure + 0.1)
                    victim.health = max(0, victim.health - victim.deterioration_rate * 3)
                elif cell.smoke_density > 0:
                    victim.hazard_exposure = min(1.0, victim.hazard_exposure + 0.03)
                    victim.health = max(0, victim.health - victim.deterioration_rate * 0.5)
                else:
                    victim.health = max(0, victim.health - victim.deterioration_rate)
            
            # Update urgency
            if victim.severity == Severity.CRITICAL:
                victim.urgency = min(1.0, victim.urgency + 0.02)
            elif victim.severity == Severity.HIGH:
                victim.urgency = min(1.0, victim.urgency + 0.01)
        
        # Update fire spread
        for hid, hazard in self.hazards.items():
            if hazard.hazard_type == HazardType.FIRE:
                new_cells = self.update_fire_spread(hazard)
                if new_cells:
                    new_events.append(SimEvent(
                        event_type=EventType.FIRE_SPREAD,
                        tick=self.tick,
                        timestamp=datetime.datetime.now().isoformat(),
                        data={"hazard_id": hid, "new_cells": [(p.x, p.y) for p in new_cells]},
                        simulation_id=self.simulation_id
                    ))
                    new_events.append(SimEvent(
                        event_type=EventType.HAZARD_CHANGED,
                        tick=self.tick,
                        timestamp=datetime.datetime.now().isoformat(),
                        data={"hazard_id": hid, "type": "FIRE", "cells": [(p.x, p.y) for p in hazard.affected_cells]},
                        simulation_id=self.simulation_id
                    ))
        
        # Update victim hazard exposure based on current grid
        for vid, victim in self.victims.items():
            if not victim.rescued:
                cell = self.get_cell(victim.position)
                if cell and cell.cell_type == CellType.FIRE:
                    new_events.append(SimEvent(
                        event_type=EventType.VICTIM_UPDATED,
                        tick=self.tick,
                        timestamp=datetime.datetime.now().isoformat(),
                        data={"victim_id": vid, "health": victim.health, "urgency": victim.urgency, "hazard_exposure": victim.hazard_exposure},
                        simulation_id=self.simulation_id
                    ))
        
        self.events.extend(new_events)
        return new_events
    
    def check_path_safety(self, path: List[Position]) -> Tuple[bool, List[Position]]:
        """Returns (is_safe, unsafe_positions)"""
        unsafe = []
        for pos in path:
            cell = self.get_cell(pos)
            if cell and not cell.is_passable:
                unsafe.append(pos)
        return len(unsafe) == 0, unsafe
    
    def get_movement_cost(self, pos: Position) -> float:
        cell = self.get_cell(pos)
        if cell is None:
            return float('inf')
        base_cost = 1.0
        return base_cost * cell.movement_cost_multiplier + cell.hazard_level * 2.0 + cell.smoke_density * 0.5
    
    def get_state_snapshot(self) -> dict:
        grid_data = []
        for y in range(self.rows):
            row = []
            for x in range(self.cols):
                cell = self.grid[y][x]
                row.append({
                    "x": x, "y": y,
                    "type": cell.cell_type.value,
                    "passable": cell.is_passable,
                    "fire_intensity": cell.fire_intensity,
                    "smoke_density": cell.smoke_density,
                    "hazard_level": cell.hazard_level,
                    "victim_id": cell.victim_id
                })
            grid_data.append(row)
        
        return {
            "tick": self.tick,
            "grid": grid_data,
            "victims": {vid: self._victim_to_dict(v) for vid, v in self.victims.items()},
            "hazards": {hid: self._hazard_to_dict(h) for hid, h in self.hazards.items()},
            "robot": self._robot_to_dict(self.robot) if self.robot else None,
        }
    
    def _victim_to_dict(self, v: VictimState) -> dict:
        return {
            "id": v.id, "position": {"x": v.position.x, "y": v.position.y},
            "severity": v.severity.value, "health": v.health, "urgency": v.urgency,
            "age": v.age, "injury_type": v.injury_type.value,
            "mobility_status": v.mobility_status.value,
            "time_since_incident": v.time_since_incident,
            "hazard_exposure": v.hazard_exposure, "rescued": v.rescued,
            "rescue_time": v.rescue_time, "priority_score": v.priority_score,
        }
    
    def _hazard_to_dict(self, h: HazardState) -> dict:
        return {
            "id": h.id, "type": h.hazard_type.value,
            "position": {"x": h.position.x, "y": h.position.y},
            "intensity": h.intensity,
            "affected_cells": [{"x": p.x, "y": p.y} for p in h.affected_cells],
        }
    
    def _robot_to_dict(self, r: RobotState) -> dict:
        return {
            "id": r.id, "position": {"x": r.position.x, "y": r.position.y},
            "battery": r.battery, "max_battery": r.max_battery,
            "status": r.status.value, "current_target": r.current_target,
            "current_path": [{"x": p.x, "y": p.y} for p in r.current_path],
            "previous_path": [{"x": p.x, "y": p.y} for p in r.previous_path],
            "path_index": r.path_index, "current_action": r.current_action.value if r.current_action else None,
            "total_distance": r.total_distance, "battery_consumed": r.battery_consumed,
            "victims_rescued": r.victims_rescued, "replans_count": r.replans_count,
        }
