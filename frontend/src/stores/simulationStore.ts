import { create } from 'zustand';
import type { ConnectionStatus, SimulationState, SimEvent, DecisionLog, Metrics, Scenario } from '../types';

interface SimulationStore {
  // Current simulation
  simulationId: string | null;
  simulationState: SimulationState | null;
  scenarios: Scenario[];
  selectedScenarioId: string;
  
  // Events
  events: SimEvent[];
  decisions: DecisionLog[];
  metrics: Metrics | null;
  
  // UI
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  error: string | null;
  currentPage: 'mission' | 'scenarios' | 'results' | 'decisions' | 'analytics' | 'config' | 'architecture';
  speed: number;
  showAILog: boolean;
  
  // Actions
  setSimulationId: (id: string | null) => void;
  setSimulationState: (state: SimulationState) => void;
  setScenarios: (scenarios: Scenario[]) => void;
  setSelectedScenario: (id: string) => void;
  addEvent: (event: SimEvent) => void;
  setEvents: (events: SimEvent[]) => void;
  addDecision: (decision: DecisionLog) => void;
  setDecisions: (decisions: DecisionLog[]) => void;
  setMetrics: (metrics: Metrics | null) => void;
  setConnected: (connected: boolean) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setError: (error: string | null) => void;
  setPage: (page: SimulationStore['currentPage']) => void;
  setSpeed: (speed: number) => void;
  toggleAILog: () => void;
  clearEvents: () => void;
  updateStateFromWS: (data: SimulationState) => void;
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  simulationId: null,
  simulationState: null,
  scenarios: [],
  selectedScenarioId: 'demo',
  events: [],
  decisions: [],
  metrics: null,
  isConnected: false,
  connectionStatus: 'DISCONNECTED',
  error: null,
  currentPage: 'scenarios',
  speed: 1,
  showAILog: true,

  setSimulationId: (id) => set({ simulationId: id }),
  setSimulationState: (state) => set({ simulationState: state }),
  setScenarios: (scenarios) => set({ scenarios }),
  setSelectedScenario: (id) => set({ selectedScenarioId: id }),
  addEvent: (event) => set(s => {
    const duplicate = s.events.some(existing =>
      existing.event_type === event.event_type &&
      existing.tick === event.tick &&
      existing.timestamp === event.timestamp &&
      JSON.stringify(existing.data) === JSON.stringify(event.data)
    );
    return duplicate ? s : { events: [...s.events.slice(-200), event] };
  }),
  setEvents: (events) => set({ events }),
  addDecision: (decision) => set(s => {
    const duplicate = s.decisions.some(existing =>
      existing.simulation_tick === decision.simulation_tick &&
      existing.selected_action === decision.selected_action &&
      existing.selected_target === decision.selected_target &&
      existing.timestamp === decision.timestamp
    );
    return duplicate ? s : { decisions: [...s.decisions.slice(-100), decision] };
  }),
  setDecisions: (decisions) => set({ decisions }),
  setMetrics: (metrics) => set({ metrics }),
  setConnected: (connected) => set({ isConnected: connected }),
  setConnectionStatus: (connectionStatus) => set({
    connectionStatus,
    isConnected: connectionStatus === 'CONNECTED',
  }),
  setError: (error) => set({ error }),
  setPage: (page) => set({ currentPage: page }),
  setSpeed: (speed) => set({ speed }),
  toggleAILog: () => set(s => ({ showAILog: !s.showAILog })),
  clearEvents: () => set({ events: [], decisions: [] }),
  
  updateStateFromWS: (data) => {
    if (!data) return;
    set({ simulationState: data, decisions: data.decision_history || [] });
  }
}));
