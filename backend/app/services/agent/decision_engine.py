from typing import List, Optional, Dict
from app.services.simulation.types import (
    RobotState, VictimState, HazardState, PathResult, DecisionResult,
    ActionType, ReasonCode, RobotStatus, PathOutcome, Position, SimEvent, EventType
)
from app.services.simulation.environment import DisasterEnvironment
from app.services.planning.astar import AStarPlanner
from app.services.triage.priority_engine import VictimTriageEngine
from app.services.safety.safety_engine import SafetyEngine
from app.services.explainability.explainer import ExplainabilityEngine
from app.core.config import settings
from app.core.logging_config import logger
import datetime

class DecisionEngine:
    def __init__(self, env: DisasterEnvironment):
        self.env = env
        self.planner = AStarPlanner(env)
        self.triage = VictimTriageEngine()
        self.safety = SafetyEngine()
        self.explainer = ExplainabilityEngine()
        self.decision_history: List[dict] = []
    
    def make_decision(self, robot: RobotState) -> DecisionResult:
        """Main decision-making loop for one AI cycle."""
        timestamp = datetime.datetime.now().isoformat()
        battery_before = robot.battery
        
        # 1. Check for emergency conditions
        is_emergency, emergency_reason = self.safety.check_emergency_conditions(robot, self.env)
        if is_emergency:
            decision = DecisionResult(
                action=ActionType.AVOID_HAZARD,
                target=None,
                priority=1.0,
                score=100.0,
                reason_codes=[ReasonCode.EMERGENCY_HAZARD],
                explanation=f"EMERGENCY: {emergency_reason}",
                path_result=None,
                replan_required=True,
                alternative_actions=[ActionType.RETURN_TO_BASE],
                constraints_checked=["emergency_safety"],
            )
            self._log_decision(decision, robot, timestamp, battery_before)
            return decision
        
        # 2. Check if must return to base
        path_to_base = self.planner.find_path(robot.position, robot.base_position)
        base_cost = len(path_to_base.path) * settings.MOVEMENT_BATTERY_COST
        must_return, return_reason = self.safety.should_return_to_base(robot, base_cost)
        
        if must_return:
            decision = DecisionResult(
                action=ActionType.RETURN_TO_BASE,
                target=None,
                priority=0.95,
                score=95.0,
                reason_codes=[ReasonCode.LOW_BATTERY, ReasonCode.RETURNING_FOR_CHARGE],
                explanation=return_reason,
                path_result=path_to_base,
                replan_required=False,
                alternative_actions=[],
                constraints_checked=["battery_safety", "return_feasibility"],
            )
            robot.status = RobotStatus.RETURNING_TO_BASE
            robot.current_path = path_to_base.path
            robot.path_index = 0
            robot.current_action = ActionType.RETURN_TO_BASE
            self._log_decision(decision, robot, timestamp, battery_before)
            return decision
        
        # 3. Get active victims
        active_victims = [v for v in self.env.victims.values() if not v.rescued and v.is_alive()]
        
        if not active_victims:
            decision = DecisionResult(
                action=ActionType.COMPLETE_MISSION,
                target=None,
                priority=1.0,
                score=100.0,
                reason_codes=[ReasonCode.MISSION_COMPLETE],
                explanation="All accessible victims have been rescued. Mission complete.",
                path_result=None,
                replan_required=False,
                alternative_actions=[],
                constraints_checked=["victim_availability"],
            )
            robot.status = RobotStatus.COMPLETED
            robot.current_action = ActionType.COMPLETE_MISSION
            self._log_decision(decision, robot, timestamp, battery_before)
            return decision
        
        # 4. If currently rescuing, continue
        if robot.status == RobotStatus.RESCUING and robot.rescue_ticks_remaining > 0:
            return DecisionResult(
                action=ActionType.RESCUE_VICTIM,
                target=robot.current_target,
                priority=1.0,
                score=100.0,
                reason_codes=[],
                explanation=f"Continuing rescue of {robot.current_target}...",
                path_result=None,
                replan_required=False,
                alternative_actions=[],
                constraints_checked=[],
            )
        
        # 5. If currently moving, check path validity
        if robot.status == RobotStatus.MOVING and robot.current_path:
            remaining_path = robot.current_path[robot.path_index:]
            path_still_valid, unsafe_positions = self.safety.check_path_still_valid(remaining_path, self.env)
            
            if not path_still_valid:
                # Trigger replan
                decision = DecisionResult(
                    action=ActionType.REPLAN,
                    target=robot.current_target,
                    priority=0.9,
                    score=90.0,
                    reason_codes=[ReasonCode.PATH_INVALIDATED, ReasonCode.REPLAN_TRIGGERED],
                    explanation=f"Current path invalidated: {len(unsafe_positions)} cell(s) blocked. Replanning...",
                    path_result=None,
                    replan_required=True,
                    alternative_actions=[ActionType.MOVE_TO_TARGET, ActionType.RETURN_TO_BASE],
                    constraints_checked=["path_validity"],
                )
                robot.status = RobotStatus.REPLANNING
                robot.replans_count += 1
                self._log_decision(decision, robot, timestamp, battery_before)
                return decision
            
            # Path still valid, continue moving
            return DecisionResult(
                action=ActionType.MOVE_TO_TARGET,
                target=robot.current_target,
                priority=0.8,
                score=80.0,
                reason_codes=[],
                explanation=f"Continuing route to {robot.current_target}.",
                path_result=None,
                replan_required=False,
                alternative_actions=[],
                constraints_checked=["path_validity"],
            )
        
        # 6. Select best victim
        priority_results = self.triage.rank_victims(active_victims, robot, self.planner, self.env)
        
        if not priority_results:
            # All victims unreachable
            decision = DecisionResult(
                action=ActionType.RETURN_TO_BASE,
                target=None,
                priority=0.7,
                score=70.0,
                reason_codes=[ReasonCode.NO_SAFE_ROUTE],
                explanation="All remaining victims are unreachable. Returning to base.",
                path_result=path_to_base,
                replan_required=False,
                alternative_actions=[ActionType.WAIT],
                constraints_checked=["victim_reachability"],
            )
            robot.status = RobotStatus.RETURNING_TO_BASE
            robot.current_path = path_to_base.path
            robot.path_index = 0
            self._log_decision(decision, robot, timestamp, battery_before)
            return decision
        
        best = priority_results[0]
        best_victim = self.env.victims[best.victim_id]
        
        # 7. Plan path to best victim
        path_result = self.planner.find_path(robot.position, best_victim.position, robot.battery)
        
        # 8. Safety check on chosen path
        is_route_safe, route_violations = self.safety.check_route_safety(path_result, self.env)
        is_battery_safe, battery_reason = self.safety.check_battery_safety(robot, path_result.battery_required + settings.RESCUE_BATTERY_COST + base_cost)
        
        if not is_battery_safe:
            decision = DecisionResult(
                action=ActionType.RETURN_TO_BASE,
                target=None,
                priority=0.9,
                score=90.0,
                reason_codes=[ReasonCode.BATTERY_INSUFFICIENT, ReasonCode.RETURNING_FOR_CHARGE],
                explanation=battery_reason,
                path_result=path_to_base,
                replan_required=False,
                alternative_actions=[],
                constraints_checked=["battery_safety"],
            )
            robot.status = RobotStatus.RETURNING_TO_BASE
            robot.current_path = path_to_base.path
            robot.path_index = 0
            self._log_decision(decision, robot, timestamp, battery_before)
            return decision
        
        reason_codes = list(best.reason_codes)
        if not is_route_safe:
            reason_codes.append(ReasonCode.FIRE_ON_PATH)
        
        explanation = self.explainer.generate_decision_explanation(
            DecisionResult(action=ActionType.MOVE_TO_TARGET, target=best.victim_id, priority=best.score/100,
                          score=best.score, reason_codes=reason_codes, explanation="",
                          path_result=path_result, replan_required=False, alternative_actions=[], constraints_checked=[]),
            victim_id=best.victim_id
        )
        
        decision = DecisionResult(
            action=ActionType.MOVE_TO_TARGET,
            target=best.victim_id,
            priority=best.score / 100.0,
            score=best.score,
            reason_codes=reason_codes,
            explanation=explanation,
            path_result=path_result,
            replan_required=False,
            alternative_actions=[ActionType.RESCUE_VICTIM] if len(priority_results) > 1 else [],
            constraints_checked=["route_safety", "battery_safety", "victim_reachability"],
        )
        
        robot.status = RobotStatus.MOVING
        robot.current_target = best.victim_id
        robot.current_path = path_result.path
        robot.path_index = 0
        robot.current_action = ActionType.MOVE_TO_TARGET
        
        self._log_decision(decision, robot, timestamp, battery_before)
        return decision
    
    def _log_decision(self, decision: DecisionResult, robot: RobotState, timestamp: str, battery_before: float):
        entry = {
            "timestamp": timestamp,
            "simulation_tick": self.env.tick,
            "robot_state": robot.status.value,
            "selected_action": decision.action.value,
            "selected_target": decision.target,
            "priority_score": decision.score,
            "reason_codes": [rc.value for rc in decision.reason_codes],
            "explanation": decision.explanation,
            "battery_before": battery_before,
            "battery_after": robot.battery,
            "replan_required": decision.replan_required,
        }
        self.decision_history.append(entry)
        logger.info(f"[DECISION] tick={self.env.tick} action={decision.action.value} target={decision.target}")
