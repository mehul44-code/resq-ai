# ResQ-AI Technical Documentation

## 1. Problem Definition

ResQ-AI simulates an autonomous rescue robot operating in a disaster environment. The core problem is:

**How should a robot with limited battery and time optimally rescue multiple victims in a dynamic, dangerous environment?**

This is a classic **utility-based decision problem** under:
- Uncertainty (fire spreads unpredictably)
- Resource constraints (battery, time)
- Competing objectives (urgency vs distance vs safety)

---

## 2. PEAS Representation

### Performance Measures
- Number of victims rescued
- Rescue time (ticks from incident to rescue)
- Battery efficiency (battery remaining at mission end)
- Route safety (hazards encountered vs avoided)
- Mission completion rate
- Number of successful replans

### Environment
- 30×20 grid (configurable)
- Static elements: walls, obstacles, base, charging stations
- Dynamic elements: fire (spreads), smoke, dangerous zones
- Victims: health, severity, urgency, position
- Simulation clock (ticks)

### Actuators
| Actuator | Effect |
|----------|--------|
| MOVE_TO_TARGET | Follow A* path one cell per tick |
| RESCUE_VICTIM | Multi-tick rescue action |
| RETURN_TO_BASE | Navigate back to base position |
| CHARGE | Replenish battery at base |
| AVOID_HAZARD | Emergency avoidance maneuver |
| REPLAN | Recalculate path and target |
| WAIT | Hold position |
| ABORT | Mission abort |

### Sensors / Perception
The robot has full observability of the environment (simplified assumption):
- Full grid state (all cell types, fire intensity, smoke)
- All victim positions, health, severity, urgency
- All hazard positions and intensities
- Own position, battery, status
- Simulation clock tick

---

## 3. Agent Type

**Classification**: Utility-Based Autonomous Agent with Goal-Directed Planning

| Property | Value |
|---------|-------|
| Observability | Fully observable |
| Determinism | Stochastic (fire spread uses seeded RNG) |
| Episodicity | Sequential (each action affects future state) |
| Dynamics | Dynamic (environment changes between actions) |
| Continuity | Discrete (tick-based simulation) |

---

## 4. State Representation

### Grid Cell State
```python
@dataclass
class GridCell:
    cell_type: CellType      # EMPTY, WALL, FIRE, SMOKE, etc.
    fire_intensity: float     # 0.0 - 1.0
    smoke_density: float      # 0.0 - 1.0
    hazard_level: float       # 0.0 - 1.0
    movement_cost_multiplier: float  # 1.0 = normal, >1 = slower
    is_passable: bool
```

### Victim State
```python
@dataclass
class VictimState:
    severity: Severity           # LOW, MEDIUM, HIGH, CRITICAL
    health: float                # 0-100, decreases over time
    urgency: float               # 0-1, increases over time
    hazard_exposure: float       # 0-1, increases near fire
    deterioration_rate: float    # Health lost per tick
    time_since_incident: float   # Ticks elapsed
```

### Robot State Machine
```
IDLE → ASSESSING → SELECTING_TARGET → PLANNING → MOVING
                                                      ↓
                                               REPLANNING ←────
                                                      ↓        |
                                                   MOVING ─────┘
                                                      ↓
                                                 RESCUING
                                                      ↓
                                           RETURNING_TO_BASE
                                                      ↓
                                                  CHARGING
                                                      ↓
                                                   IDLE / COMPLETED
```

---

## 5. Victim Triage / Priority Engine

### Priority Score Formula

```
Priority(v) = (
    severity_score     × W_severity        +  [0.30]
    time_criticality   × W_time            +  [0.25]
    deterioration_risk × W_deterioration   +  [0.20]
    hazard_exposure    × W_hazard          +  [0.15]
    accessibility      × W_accessibility   -  [0.10]
    path_risk_penalty                         [variable]
) × 100
```

All weights are configurable via environment variables.

### Reason Code Generation
Every priority evaluation produces structured reason codes:

| Code | Trigger |
|------|---------|
| CRITICAL_MEDICAL_STATE | severity == CRITICAL |
| HIGH_HAZARD_EXPOSURE | hazard_exposure > 0.3 |
| RAPID_DETERIORATION | health decline rate high |
| REACHABLE_WITH_ACCEPTABLE_RISK | path outcome == SAFE_PATH_FOUND |
| NO_SAFE_ROUTE | no A* path found |
| VICTIM_DETERIORATING | time_since_incident > 30 |
| FIRE_ON_PATH | fire cells in route |

---

## 6. A* Path Planning

### Cost Function

```python
cell_cost(pos) = (
    1.0 × movement_cost_multiplier   # Base movement
    + fire_intensity × 1000.0         # Fire is nearly impassable
    + smoke_density × 3.0             # Smoke slows movement
    + hazard_level × 4.0              # General hazard penalty
    + dangerous_zone_penalty × 5.0    # Zone penalty
)
```

### Path Outcomes

| Outcome | Condition |
|---------|-----------|
| SAFE_PATH_FOUND | Risk ≤ 0.6, cost ≤ normal × 3 |
| SAFE_BUT_EXPENSIVE | Cost > normal × 3 but reachable |
| HIGH_RISK_PATH | Risk > 0.6 |
| NO_SAFE_PATH | Battery insufficient |
| TARGET_UNREACHABLE | No path exists |

### Battery Estimation

Before choosing a victim:
```
battery_required = (
    steps_to_victim × MOVEMENT_BATTERY_COST    +
    RESCUE_BATTERY_COST                         +
    steps_to_base × MOVEMENT_BATTERY_COST       +
    BATTERY_RESERVE_THRESHOLD
)
```

If `battery_required > robot.battery`, the target is rejected.

---

## 7. Dynamic Replanning

### Trigger Conditions

| Trigger | Condition |
|---------|-----------|
| PATH_INVALIDATED | Fire spreads to path cell |
| ROUTE_BLOCKED | Obstacle appears on path |
| BATTERY_LOW | Battery drops below return threshold |
| VICTIM_UNREACHABLE | Target becomes blocked |
| EMERGENCY_HAZARD | Robot is in fire zone |

### Replan Procedure

```
1. Detect path invalidation (check_path_still_valid)
2. Set robot.status = REPLANNING
3. Increment robot.replans_count
4. Broadcast REPLAN_TRIGGERED event
5. Clear current_path
6. Re-run full decision cycle:
   a. Re-rank all victims (priorities may have changed)
   b. Find new A* path to best victim
   c. Safety check new path
   d. Generate explanation: "Replanning due to X"
7. Broadcast new DECISION_CREATED
8. Continue movement on new path
```

---

## 8. Safety Engine

Safety checks **override** utility optimization:

```python
def make_decision(robot):
    # 1. Emergency check (overrides everything)
    if robot_in_fire_zone:
        return AVOID_HAZARD
    
    # 2. Battery return check
    if battery < return_cost + RESERVE:
        return RETURN_TO_BASE
    
    # 3. Path safety check
    if chosen_path has fire cells:
        reject this path
    
    # 4. Battery feasibility check
    if battery_required > available_battery:
        return RETURN_TO_BASE
    
    # 5. Proceed with utility-optimal decision
```

---

## 9. Explainability Engine

Every decision produces human-readable explanations **derived from structured data** — not generated post-hoc by an LLM.

### Example Explanations

```
"Victim VA selected because: victim is in critical medical condition; 
victim has high exposure to environmental hazards; victim health is 
deteriorating rapidly; victim can be reached through a low-risk route."

"Replanning triggered because: the current path has been invalidated 
by environmental changes; conditions have changed requiring new path planning."

"Returning to base because: robot battery is running low; robot must 
return to base for charging. Insufficient battery: need 45.0, have 12.0 
(reserve: 15.0)"
```

## 10. Phase 6 Fixes and Stability Work

The regression pass for Phase 6 addressed several correctness issues that could otherwise produce false-positive rescue states or misleading decision histories:

- `A1`: moving-robot invalidations are processed through the same decision engine path as every other replan, guaranteeing one logged replan decision with a real explanation.
- `A2`: unreachable victims are screened out before selection, so a walled-off target is never treated as a valid rescue candidate or rescued without a real path.
- `A3`: the dead A* start-cell `pass` block was removed and replaced with explicit comments describing the intended behavior for impassable starting cells.
- `A4`: average rescue time is computed from `incident_start_tick`, which gives realistic elapsed rescue durations instead of near-zero values.
- `A5`: unused ML dependencies were removed from the backend requirements file, reducing install weight and avoiding stale package noise.
- `A6`: backend CORS parsing now accepts a comma-separated `CORS_ORIGINS` setting so Vite preview mode on port `4173` can load data and sockets without browser rejection.
- `A7`: the no-op invalidation check was removed to avoid silently skipping logic that was supposed to emit a replan event.

### Current project status

- Scenario count: 11 total scenario entries (10 standard scenarios + Competition Demo)
- Backend test count: current suite remains under regular pytest verification and is maintained as the guardrail for all logic changes
- CORS / preview setup: `npm run build` and `npm run preview -- --host 0.0.0.0` work correctly when the preview origin is present in the backend `.env` `CORS_ORIGINS` list

---
```

---

## 10. Metrics / Performance

All metrics are **calculated from actual simulation data**:

```python
metrics = {
    "total_victims": len(victims),
    "rescued_victims": len([v for v in victims if v.rescued]),
    "mission_completion_rate": rescued / total × 100,
    "average_rescue_time": mean(rescue_time - incident_time),
    "total_distance_traveled": robot.total_distance,
    "battery_consumed": robot.battery_consumed,
    "replans_count": robot.replans_count,
    "mission_score": calculate_score(...)
}
```

### Mission Score Components

| Component | Weight | Description |
|-----------|--------|-------------|
| Rescue Score | 40 pts | (rescued/total) × 40 |
| Urgency Score | 10 pts | Weighted urgency of rescued victims |
| Time Score | 20 pts | Faster = better |
| Battery Score | 10 pts | Battery remaining × 0.1 |
| Replan Score | 10 pts | Successful replanning shows adaptability |
| Critical Rescue Score | 10 pts | Critical victims saved |

**Total: 0–100** (labeled as simulation metric, not real-world proof)

---

## 11. Testing Coverage

| Test File | What's Tested |
|-----------|--------------|
| `test_triage.py` | Priority scoring, critical victim ranking, rescue exclusion |
| `test_astar.py` | Path finding, wall avoidance, fire avoidance, no-path detection |
| `test_simulation.py` | Tick execution, fire spread, scenario loading, metrics |
| `test_battery.py` | Battery safety checks, return-to-base decisions |

---

## 12. Database Schema

```sql
scenarios (id, name, description, difficulty, grid_cols, grid_rows, seed)
simulation_runs (id, scenario_id, status, started_at, completed_at, total_ticks, mission_score)
decisions (id, simulation_id, tick, action, target, score, reason_codes, explanation, battery_before, battery_after)
events (id, simulation_id, event_type, tick, timestamp, data)
```

---

## 13. Limitations

- Single robot (no multi-agent coordination)
- Fully observable environment (simplified assumption)
- 4-directional movement only
- Linear victim deterioration model
- Fire spread uses simple RNG, not fluid dynamics
- No real ML triage model in v1 (deterministic fallback used)

---

## 14. Future Scope

- Multi-robot task allocation
- Partial observability with sensor uncertainty
- ML-based urgency prediction (scikit-learn)
- Diagonal A* movement
- Floor plan import (SVG → grid)
- Earthquake/flood/chemical leak scenarios
- PostgreSQL backend for multi-user support
- Mission replay from event log
- Mobile command-center interface
