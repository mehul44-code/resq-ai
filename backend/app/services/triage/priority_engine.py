from typing import List, Optional, Dict
from app.services.simulation.types import (
    VictimState, RobotState, PathResult, PriorityResult, ReasonCode, Severity, PathOutcome
)
from app.services.simulation.environment import DisasterEnvironment
from app.services.planning.astar import AStarPlanner
from app.core.config import settings

class VictimTriageEngine:
    SEVERITY_SCORES = {
        Severity.CRITICAL: 1.0,
        Severity.HIGH: 0.75,
        Severity.MEDIUM: 0.50,
        Severity.LOW: 0.25,
    }
    
    def calculate_priority(self, victim: VictimState, robot: RobotState, 
                           path_result: Optional[PathResult], env: DisasterEnvironment) -> PriorityResult:
        reason_codes = []
        breakdown = {}
        
        # Medical severity (0-1)
        severity_score = self.SEVERITY_SCORES.get(victim.severity, 0.25)
        breakdown["severity"] = severity_score * settings.SEVERITY_WEIGHT
        
        if victim.severity == Severity.CRITICAL:
            reason_codes.append(ReasonCode.CRITICAL_MEDICAL_STATE)
        
        # Time criticality: urgency + time since incident (0-1)
        time_score = min(1.0, victim.urgency * 0.7 + (victim.time_since_incident / 100) * 0.3)
        breakdown["time_criticality"] = time_score * settings.TIME_CRITICALITY_WEIGHT
        
        # Deterioration risk: health declining, severity
        health_fraction = (100 - victim.health) / 100
        det_score = health_fraction * 0.6 + victim.deterioration_rate * 10 * 0.4
        det_score = min(1.0, det_score)
        breakdown["deterioration"] = det_score * settings.DETERIORATION_WEIGHT
        
        if det_score > 0.5:
            reason_codes.append(ReasonCode.RAPID_DETERIORATION)
        if victim.time_since_incident > 30:
            reason_codes.append(ReasonCode.VICTIM_DETERIORATING)
        
        # Hazard exposure (0-1)
        hazard_score = victim.hazard_exposure
        breakdown["hazard_exposure"] = hazard_score * settings.HAZARD_EXPOSURE_WEIGHT
        
        if hazard_score > 0.3:
            reason_codes.append(ReasonCode.HIGH_HAZARD_EXPOSURE)
        
        # Accessibility (0-1)
        if path_result is None or not path_result.path:
            accessibility_score = 0.0
            reason_codes.append(ReasonCode.NO_SAFE_ROUTE)
        elif path_result.outcome == PathOutcome.TARGET_UNREACHABLE:
            accessibility_score = 0.0
        elif path_result.outcome == PathOutcome.SAFE_PATH_FOUND:
            accessibility_score = 1.0
            reason_codes.append(ReasonCode.REACHABLE_WITH_ACCEPTABLE_RISK)
        elif path_result.outcome == PathOutcome.SAFE_BUT_EXPENSIVE:
            accessibility_score = 0.6
        elif path_result.outcome == PathOutcome.HIGH_RISK_PATH:
            accessibility_score = 0.3
            reason_codes.append(ReasonCode.FIRE_ON_PATH)
        else:
            accessibility_score = 0.4
        
        # Distance penalty: farther victims are slightly deprioritized if closer alternatives exist
        dist = robot.position.distance_to(victim.position) if path_result is None else len(path_result.path)
        dist_penalty = min(1.0, dist / 50.0)
        accessibility_score_adj = accessibility_score * (1 - dist_penalty * 0.3)
        breakdown["accessibility"] = accessibility_score_adj * settings.ACCESSIBILITY_WEIGHT
        
        total_score = sum(breakdown.values()) * 100  # 0-100 scale
        
        # Deduct for path risk
        if path_result and path_result.risk_score:
            total_score -= path_result.risk_score * 10
        
        total_score = max(0, min(100, total_score))
        
        return PriorityResult(
            victim_id=victim.id,
            score=total_score,
            reason_codes=reason_codes,
            breakdown=breakdown
        )
    
    def rank_victims(self, victims: List[VictimState], robot: RobotState,
                     planner: AStarPlanner, env: DisasterEnvironment) -> List[PriorityResult]:
        results = []
        for victim in victims:
            if victim.rescued or not victim.is_alive():
                continue
            path_result = planner.find_path(robot.position, victim.position, robot.battery)
            priority = self.calculate_priority(victim, robot, path_result, env)
            victim.priority_score = priority.score
            results.append(priority)
        
        results.sort(key=lambda r: r.score, reverse=True)
        return results
