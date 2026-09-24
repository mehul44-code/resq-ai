from typing import List, Optional
from app.services.simulation.types import (
    ReasonCode, DecisionResult, ActionType, PriorityResult, PathResult, PathOutcome
)

REASON_CODE_MESSAGES = {
    ReasonCode.CRITICAL_MEDICAL_STATE: "victim is in critical medical condition",
    ReasonCode.HIGH_HAZARD_EXPOSURE: "victim has high exposure to environmental hazards",
    ReasonCode.RAPID_DETERIORATION: "victim health is deteriorating rapidly",
    ReasonCode.REACHABLE_WITH_ACCEPTABLE_RISK: "victim can be reached through a low-risk route",
    ReasonCode.LOW_BATTERY: "robot battery is running low",
    ReasonCode.ROUTE_BLOCKED: "the planned route has become blocked",
    ReasonCode.FIRE_ON_PATH: "fire is present on the planned route",
    ReasonCode.SAFER_ROUTE_FOUND: "a safer alternative route has been identified",
    ReasonCode.BATTERY_INSUFFICIENT: "battery is insufficient to complete the rescue and return safely",
    ReasonCode.NO_SAFE_ROUTE: "no safe route exists to this victim",
    ReasonCode.VICTIM_DETERIORATING: "victim condition has been worsening over time",
    ReasonCode.VICTIM_NEAREST: "victim is the nearest reachable target",
    ReasonCode.RETURNING_FOR_CHARGE: "robot must return to base for charging",
    ReasonCode.MISSION_COMPLETE: "all reachable victims have been rescued",
    ReasonCode.REPLAN_TRIGGERED: "conditions have changed requiring new path planning",
    ReasonCode.ALTERNATIVE_ROUTE: "an alternative route was selected after original became unsafe",
    ReasonCode.HIGH_PRIORITY_VICTIM: "victim has the highest calculated priority score",
    ReasonCode.CLOSEST_REACHABLE: "victim is the closest reachable target",
    ReasonCode.PATH_INVALIDATED: "the current path has been invalidated by environmental changes",
    ReasonCode.EMERGENCY_HAZARD: "robot has encountered an emergency hazard",
}

ACTION_TEMPLATES = {
    ActionType.MOVE_TO_TARGET: "Moving to {target}",
    ActionType.RESCUE_VICTIM: "Performing rescue of {target}",
    ActionType.AVOID_HAZARD: "Avoiding hazard — recalculating route",
    ActionType.REPLAN: "Replanning due to changed conditions",
    ActionType.RETURN_TO_BASE: "Returning to base",
    ActionType.CHARGE: "Charging battery at station",
    ActionType.WAIT: "Waiting for conditions to change",
    ActionType.ABORT: "Mission aborted",
    ActionType.COMPLETE_MISSION: "Mission complete",
}

class ExplainabilityEngine:
    def generate_decision_explanation(self, decision: DecisionResult, victim_id: Optional[str] = None) -> str:
        reasons = [REASON_CODE_MESSAGES.get(rc, rc.value) for rc in decision.reason_codes]
        
        if decision.action == ActionType.MOVE_TO_TARGET and victim_id:
            target_str = victim_id
            if reasons:
                return (f"Victim {target_str} selected because: " + "; ".join(reasons) + ".")
            return f"Moving to rescue Victim {target_str}."
        
        elif decision.action == ActionType.REPLAN:
            if reasons:
                return "Replanning triggered because: " + "; ".join(reasons) + "."
            return "Replanning due to changed environmental conditions."
        
        elif decision.action == ActionType.RETURN_TO_BASE:
            if reasons:
                return "Returning to base because: " + "; ".join(reasons) + "."
            return "Returning to base."
        
        elif decision.action == ActionType.RESCUE_VICTIM:
            return f"Initiating rescue procedure for Victim {victim_id or 'unknown'}."
        
        elif decision.action == ActionType.COMPLETE_MISSION:
            return "All accessible victims have been rescued. Mission complete."
        
        else:
            action_text = ACTION_TEMPLATES.get(decision.action, decision.action.value)
            if reasons:
                return action_text.format(target=victim_id or "target") + " Reason: " + "; ".join(reasons) + "."
            return action_text.format(target=victim_id or "target")
    
    def generate_path_explanation(self, path_result: PathResult, was_replanned: bool = False) -> str:
        if path_result.outcome == PathOutcome.SAFE_PATH_FOUND:
            prefix = "Alternative safe route selected" if was_replanned else "Safe route planned"
            return f"{prefix}: {len(path_result.path)} steps, risk score {path_result.risk_score:.2f}."
        elif path_result.outcome == PathOutcome.SAFE_BUT_EXPENSIVE:
            return f"Route planned but at higher cost ({path_result.cost:.1f}). Risk: {path_result.risk_score:.2f}."
        elif path_result.outcome == PathOutcome.HIGH_RISK_PATH:
            return f"WARNING: Only high-risk route available. Risk: {path_result.risk_score:.2f}."
        elif path_result.outcome == PathOutcome.NO_SAFE_PATH:
            return f"No safe path found. {path_result.reason}"
        elif path_result.outcome == PathOutcome.TARGET_UNREACHABLE:
            return f"Target is unreachable. {path_result.reason}"
        return f"Path result: {path_result.outcome.value}"
    
    def generate_triage_explanation(self, priority_result: PriorityResult) -> str:
        reasons = [REASON_CODE_MESSAGES.get(rc, rc.value) for rc in priority_result.reason_codes]
        score_str = f"{priority_result.score:.1f}/100"
        
        breakdown_str = ", ".join([f"{k}: {v*100:.1f}" for k, v in priority_result.breakdown.items()])
        
        exp = f"Victim {priority_result.victim_id}: Priority score {score_str}."
        if reasons:
            exp += " Key factors: " + "; ".join(reasons) + "."
        return exp
