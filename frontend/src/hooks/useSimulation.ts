import { useEffect, useCallback } from 'react';
import { useSimulationStore } from '../stores/simulationStore';
import { api } from '../services/api';
import { wsService } from '../services/websocket';
import type { DecisionLog, SimulationState, WebSocketEvent } from '../types';

function isSimulationState(value: unknown): value is SimulationState {
  return typeof value === 'object' && value !== null && 'simulation_id' in value && 'grid' in value;
}

function isDecisionData(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function useSimulation() {
  const store = useSimulationStore();
  const { simulationId } = store;

  const handleWSEvent = useCallback((event: WebSocketEvent) => {
    const { type, data, tick, timestamp } = event;
    
    if (type === 'connected') {
      store.setConnected(true);
      if (isSimulationState(event.state)) {
        store.setSimulationState(event.state);
        store.setDecisions(event.state.decision_history || []);
      }
      return;
    }
    
    if (type === 'connection') {
      const status = isDecisionData(data) ? data.status : undefined;
      if (typeof status === 'string') {
        store.setConnectionStatus(status as Parameters<typeof store.setConnectionStatus>[0]);
      }
      return;
    }

    if (type === 'tick_updated' && isSimulationState(data)) {
      store.updateStateFromWS(data);
      return;
    }
    
    if (type === 'decision_created' && isDecisionData(data)) {
      const decision: DecisionLog = {
        timestamp: timestamp || new Date().toISOString(),
        simulation_tick: tick || 0,
        robot_state: 'ACTIVE',
        selected_action: String(data.action || ''),
        selected_target: typeof data.target === 'string' ? data.target : null,
        priority_score: Number(data.score || 0),
        reason_codes: Array.isArray(data.reason_codes) ? data.reason_codes.map(String) : [],
        explanation: String(data.explanation || ''),
        battery_before: Number(data.battery_before || 0),
        battery_after: Number(data.battery_after || 0),
        replan_required: Boolean(data.replan_required),
        candidate_evaluations: Array.isArray(data.candidate_evaluations)
          ? data.candidate_evaluations as DecisionLog['candidate_evaluations']
          : [],
      };
      store.addDecision(decision);
    }
    
    // Add to event log
    if (type && type !== 'pong') {
      store.addEvent({
        event_type: type,
        tick: tick || 0,
        timestamp: timestamp || new Date().toISOString(),
        data: data || {}
      });
    }
    
    if (type === 'mission_completed' && simulationId) {
      api.getMetrics(simulationId).then(store.setMetrics).catch(console.error);
    }
  }, [simulationId]);
  
  useEffect(() => {
    if (!simulationId) return;
    const unsub = wsService.on('*', handleWSEvent);
    const unsubConnection = wsService.on('connection', handleWSEvent);
    store.setConnectionStatus('CONNECTING');
    wsService.connect(simulationId);
    
    // Fetch initial state
    Promise.all([
      api.getState(simulationId),
      api.getEvents(simulationId),
      api.getDecisions(simulationId),
      api.getMetrics(simulationId),
    ]).then(([state, events, decisions, metrics]) => {
      store.setSimulationState(state);
      store.setEvents(events);
      store.setDecisions(decisions);
      store.setMetrics(metrics);
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to load simulation data';
      store.setError(message);
      console.error(error);
    });
    
    return () => {
      unsub();
      unsubConnection();
      wsService.disconnect();
      store.setConnectionStatus('DISCONNECTED');
    };
  }, [simulationId]);
  
  const createAndStart = useCallback(async (scenarioId: string) => {
    try {
      const sim = await api.createSimulation(scenarioId);
      store.setSimulationId(sim.id);
      store.setError(null);
      store.clearEvents();
      store.setMetrics(null);
      // WebSocket will connect via the useEffect above
      // Slight delay to let WS connect then start
      setTimeout(async () => {
        await api.startSimulation(sim.id);
      }, 300);
      return sim.id;
    } catch (e) {
      console.error('Failed to create simulation:', e);
      throw e;
    }
  }, [store]);
  
  const pause = useCallback(async () => {
    if (!simulationId) return;
    await api.pauseSimulation(simulationId);
  }, [simulationId]);
  
  const resume = useCallback(async () => {
    if (!simulationId) return;
    await api.resumeSimulation(simulationId);
  }, [simulationId]);
  
  const reset = useCallback(async () => {
    if (!simulationId) return;
    await api.resetSimulation(simulationId);
    store.clearEvents();
  }, [simulationId]);
  
  const step = useCallback(async () => {
    if (!simulationId) return;
    await api.stepSimulation(simulationId);
    const state = await api.getState(simulationId);
    store.setSimulationState(state);
  }, [simulationId]);
  
  const injectEvent = useCallback(async (eventType: string, data: any) => {
    if (!simulationId) return;
    await api.injectEvent(simulationId, eventType, data);
  }, [simulationId]);
  
  return { createAndStart, pause, resume, reset, step, injectEvent };
}
