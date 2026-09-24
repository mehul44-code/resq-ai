import { create } from 'zustand';
import type { SimulationState, SimEvent, DecisionLog, Metrics, Scenario } from '../types';

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
  currentPage: 'mission' | 'scenarios' | 'results' | 'decisions' | 'analytics' | 'config' | 'architecture';
  speed: number;
  showAILog: boolean;
  
  // Actions
  setSimulationId: (id: string | null) => void;
  setSimulationState: (state: SimulationState) => void;
  setScenarios: (scenarios: Scenario[]) => void;
  setSelectedScenario: (id: string) => void;
  addEvent: (event: SimEvent) => void;
  addDecision: (decision: DecisionLog) => void;
  setDecisions: (decisions: DecisionLog[]) => void;
  setMetrics: (metrics: Metrics) => void;
  setConnected: (connected: boolean) => void;
  setPage: (page: SimulationStore['currentPage']) => void;
  setSpeed: (speed: number) => void;
  toggleAILog: () => void;
  clearEvents: () => void;
  updateStateFromWS: (data: any) => void;
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  simulationId: null,
  simulationState: null,
  scenarios: [],
  selectedScenarioId: 'demo',
  events: [],
  decisions: [],
  metrics: null,
  isConnected: false,
  currentPage: 'scenarios',
  speed: 1,
  showAILog: true,

  setSimulationId: (id) => set({ simulationId: id }),
  setSimulationState: (state) => set({ simulationState: state }),
  setScenarios: (scenarios) => set({ scenarios }),
  setSelectedScenario: (id) => set({ selectedScenarioId: id }),
  addEvent: (event) => set(s => ({ events: [...s.events.slice(-200), event] })),
  addDecision: (decision) => set(s => ({ decisions: [...s.decisions.slice(-100), decision] })),
  setDecisions: (decisions) => set({ decisions }),
  setMetrics: (metrics) => set({ metrics }),
  setConnected: (connected) => set({ isConnected: connected }),
  setPage: (page) => set({ currentPage: page }),
  setSpeed: (speed) => set({ speed }),
  toggleAILog: () => set(s => ({ showAILog: !s.showAILog })),
  clearEvents: () => set({ events: [], decisions: [] }),
  
  updateStateFromWS: (data) => {
    if (!data) return;
    const current = get().simulationState;
    set({
      simulationState: {
        ...current,
        ...data,
        tick: data.tick ?? current?.tick ?? 0,
        grid: data.grid ?? current?.grid ?? [],
        victims: data.victims ?? current?.victims ?? {},
        hazards: data.hazards ?? current?.hazards ?? {},
        robot: data.robot ?? current?.robot ?? null,
        decision_history: data.decision_history ?? current?.decision_history ?? [],
      } as SimulationState
    });
  }
}));
