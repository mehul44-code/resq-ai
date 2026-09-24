from typing import List, Dict
from app.services.simulation.types import VictimState, RobotState, Severity, SimEvent, EventType
import datetime

class MetricsEngine:
    def calculate(self, victims: Dict[str, VictimState], robot: RobotState,
                  events: List[SimEvent], total_ticks: int, scenario_name: str = "") -> dict:
        total_victims = len(victims)
        rescued = [v for v in victims.values() if v.rescued]
        remaining = [v for v in victims.values() if not v.rescued]
        critical_victims = [v for v in victims.values() if v.severity == Severity.CRITICAL]
        critical_rescued = [v for v in rescued if v.severity == Severity.CRITICAL]
        
        rescue_times = [
            (v.rescue_time - v.time_since_incident)
            for v in rescued if v.rescue_time is not None
        ]
        avg_rescue_time = sum(rescue_times) / len(rescue_times) if rescue_times else 0
        
        fire_spread_events = [e for e in events if e.event_type == EventType.FIRE_SPREAD]
        replan_events = [e for e in events if e.event_type == EventType.REPLAN_TRIGGERED]
        path_invalid_events = [e for e in events if e.event_type == EventType.PATH_INVALIDATED]
        
        completion_rate = len(rescued) / total_victims if total_victims > 0 else 0
        
        # Mission score calculation
        rescue_score = (len(rescued) / total_victims * 40) if total_victims > 0 else 0
        urgency_score = sum(v.urgency * 10 for v in rescued) / max(1, total_victims)
        time_score = max(0, 20 - (total_ticks / 50))
        battery_score = (robot.battery / robot.max_battery) * 10
        replan_score = min(10, robot.replans_count * 2) if robot.replans_count > 0 else 0
        critical_score = (len(critical_rescued) / len(critical_victims) * 10) if critical_victims else 10
        
        mission_score = min(100, rescue_score + urgency_score + time_score + battery_score + replan_score + critical_score)
        
        return {
            "total_victims": total_victims,
            "rescued_victims": len(rescued),
            "remaining_victims": len(remaining),
            "mission_completion_rate": round(completion_rate * 100, 1),
            "average_rescue_time": round(avg_rescue_time, 1),
            "total_mission_time": total_ticks,
            "total_distance_traveled": robot.total_distance,
            "battery_consumed": round(robot.battery_consumed, 1),
            "battery_remaining": round(robot.battery, 1),
            "hazards_encountered": len(fire_spread_events),
            "replans_count": robot.replans_count,
            "successful_replans": len(replan_events),
            "blocked_route_events": len(path_invalid_events),
            "critical_victims_total": len(critical_victims),
            "critical_victims_rescued": len(critical_rescued),
            "mission_score": round(mission_score, 1),
            "score_breakdown": {
                "rescue_score": round(rescue_score, 1),
                "urgency_score": round(urgency_score, 1),
                "time_score": round(time_score, 1),
                "battery_score": round(battery_score, 1),
                "replan_score": round(replan_score, 1),
                "critical_rescue_score": round(critical_score, 1)
            },
            "scenario_name": scenario_name
        }
