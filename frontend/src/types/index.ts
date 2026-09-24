export type CellType = 'empty' | 'wall' | 'obstacle' | 'victim' | 'fire' | 'smoke' | 'dangerous_zone' | 'safe_zone' | 'base' | 'blocked' | 'charging_station';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RobotStatus = 'IDLE' | 'ASSESSING' | 'SELECTING_TARGET' | 'PLANNING' | 'MOVING' | 'RESCUING' | 'REPLANNING' | 'RETURNING_TO_BASE' | 'CHARGING' | 'COMPLETED' | 'ABORTED' | 'STUCK';
export type SimulationStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'ABORTED';
export type ActionType = 'MOVE_TO_TARGET' | 'RESCUE_VICTIM' | 'AVOID_HAZARD' | 'REPLAN' | 'RETURN_TO_BASE' | 'CHARGE' | 'WAIT' | 'ABORT' | 'COMPLETE_MISSION';

export interface Position { x: number; y: number; }

export interface GridCell {
  x: number; y: number;
  type: CellType;
  passable: boolean;
  fire_intensity: number;
  smoke_density: number;
  hazard_level: number;
  victim_id: string | null;
}

export interface Victim {
  id: string;
  position: Position;
  severity: Severity;
  health: number;
  urgency: number;
  age: number;
  injury_type: string;
  mobility_status: string;
  time_since_incident: number;
  hazard_exposure: number;
  rescued: boolean;
  rescue_time: number | null;
  priority_score: number;
}

export interface Hazard {
  id: string;
  type: string;
  position: Position;
  intensity: number;
  affected_cells: Position[];
}

export interface Robot {
  id: string;
  position: Position;
  battery: number;
  max_battery: number;
  status: RobotStatus;
  current_target: string | null;
  current_path: Position[];
  path_index: number;
  current_action: ActionType | null;
  total_distance: number;
  battery_consumed: number;
  victims_rescued: number;
  replans_count: number;
}

export interface DecisionLog {
  timestamp: string;
  simulation_tick: number;
  robot_state: string;
  selected_action: string;
  selected_target: string | null;
  priority_score: number;
  reason_codes: string[];
  explanation: string;
  battery_before: number;
  battery_after: number;
  replan_required: boolean;
}

export interface SimulationState {
  simulation_id: string;
  scenario_id: string;
  status: SimulationStatus;
  tick: number;
  grid: GridCell[][];
  victims: Record<string, Victim>;
  hazards: Record<string, Hazard>;
  robot: Robot | null;
  decision_history: DecisionLog[];
}

export interface WebSocketEvent {
  type: string;
  tick?: number;
  timestamp?: string;
  data?: any;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  grid_cols: number;
  grid_rows: number;
}

export interface Metrics {
  total_victims: number;
  rescued_victims: number;
  remaining_victims: number;
  mission_completion_rate: number;
  average_rescue_time: number;
  total_mission_time: number;
  total_distance_traveled: number;
  battery_consumed: number;
  battery_remaining: number;
  hazards_encountered: number;
  replans_count: number;
  mission_score: number;
  score_breakdown: Record<string, number>;
  scenario_name: string;
}

export interface SimEvent {
  event_type: string;
  tick: number;
  timestamp: string;
  data: any;
}
