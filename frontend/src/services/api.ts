const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  health: () => fetchJSON<{ status: string; service?: string }>('/api/health'),
  // Scenarios
  getScenarios: () => fetchJSON<import('../types').Scenario[]>('/api/scenarios'),
  getScenario: (id: string) => fetchJSON<import('../types').ScenarioConfig>(`/api/scenarios/${id}`),
  
  // Simulations
  createSimulation: (scenario_id: string) => fetchJSON<{ id: string; scenario_id: string; status: string }>(
    '/api/simulations', { method: 'POST', body: JSON.stringify({ scenario_id }) }
  ),
  listSimulations: () => fetchJSON<any[]>('/api/simulations'),
  getSimulation: (id: string) => fetchJSON<SimulationSummary>(`/api/simulations/${id}`),
  startSimulation: (id: string) => fetchJSON<ActionResponse>(`/api/simulations/${id}/start`, { method: 'POST' }),
  pauseSimulation: (id: string) => fetchJSON<ActionResponse>(`/api/simulations/${id}/pause`, { method: 'POST' }),
  resumeSimulation: (id: string) => fetchJSON<ActionResponse>(`/api/simulations/${id}/resume`, { method: 'POST' }),
  resetSimulation: (id: string) => fetchJSON<ActionResponse>(`/api/simulations/${id}/reset`, { method: 'POST' }),
  stepSimulation: (id: string) => fetchJSON<ActionResponse>(`/api/simulations/${id}/step`, { method: 'POST' }),
  getState: (id: string) => fetchJSON<import('../types').SimulationState>(`/api/simulations/${id}/state`),
  getEvents: (id: string, limit?: number) => fetchJSON<import('../types').SimEvent[]>(`/api/simulations/${id}/events?limit=${limit || 100}`),
  getDecisions: (id: string) => fetchJSON<import('../types').DecisionLog[]>(`/api/simulations/${id}/decisions`),
  getMetrics: (id: string) => fetchJSON<import('../types').Metrics>(`/api/simulations/${id}/metrics`),
  injectEvent: (id: string, event_type: string, data: Record<string, unknown>) =>
    fetchJSON<ActionResponse>(`/api/simulations/${id}/inject-event`, {
      method: 'POST', body: JSON.stringify({ event_type, data })
    }),
};

interface SimulationSummary {
  id: string;
  scenario_id: string;
  status: string;
  tick: number;
}

interface ActionResponse {
  status: string;
  tick?: number;
}
