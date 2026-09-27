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
  const { setConnected, setSimulationState, setDecisions, setConnectionStatus, setEvents, setMetrics, setError } = store;

  const handleWSEvent = useCallback((event: WebSocketEvent) => {
    const { type, data, tick, timestamp } = event;
    
    if (type === 'connected') {
      setConnected(true);
      if (isSimulationState(event.state)) {
        setSimulationState(event.state);
        setDecisions(event.state.decision_history || []);
      }
      return;
    }
    
    if (type === 'connection') {
      const status = isDecisionData(data) ? data.status : undefined;
      if (typeof status === 'string') {
        setConnectionStatus(status as Parameters<typeof setConnectionStatus>[0]);
      }
      return;
    }

    if (type === 'tick_updated' && isSimulationState(data)) {
      setSimulationState(data);
      setDecisions(data.decision_history || []);
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
      useSimulationStore.getState().addDecision(decision);
    }
    
    // Add to event log
    if (type && type !== 'pong') {
      useSimulationStore.getState().addEvent({
        event_type: type,
        tick: tick || 0,
        timestamp: timestamp || new Date().toISOString(),
        data: data || {}
      });
    }
    
    if (type === 'mission_completed' && simulationId) {
      api.getMetrics(simulationId).then(setMetrics).catch(console.error);
    }
  }, [simulationId, setConnected, setSimulationState, setDecisions, setConnectionStatus, setMetrics]);
  
  useEffect(() => {
    if (!simulationId) return;
    const unsub = wsService.on('*', handleWSEvent);
    const unsubConnection = wsService.on('connection', handleWSEvent);
    setConnectionStatus('CONNECTING');
    wsService.connect(simulationId);
    
    // Fetch initial state
    Promise.all([
      api.getState(simulationId),
      api.getEvents(simulationId),
      api.getDecisions(simulationId),
      api.getMetrics(simulationId),
    ]).then(([state, events, decisions, metrics]) => {
      setSimulationState(state);
      setEvents(events);
      setDecisions(decisions);
      setMetrics(metrics);
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to load simulation data';
      setError(message);
      console.error(error);
    });
    
    return () => {
      unsub();
      unsubConnection();
      wsService.disconnect();
      setConnectionStatus('DISCONNECTED');
    };
  }, [simulationId, handleWSEvent, setConnectionStatus, setSimulationState, setEvents, setDecisions, setMetrics, setError]);
  
  const createAndStart = useCallback(async (scenarioId: string) => {
    try {
      const sim = await api.createSimulation(scenarioId);
      useSimulationStore.getState().setSimulationId(sim.id);
      setError(null);
      useSimulationStore.getState().clearEvents();
      setMetrics(null);
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
  }, [setError, setMetrics]);
  
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
    useSimulationStore.getState().clearEvents();
  }, [simulationId]);
  
  const step = useCallback(async () => {
    if (!simulationId) return;
    await api.stepSimulation(simulationId);
    const state = await api.getState(simulationId);
    setSimulationState(state);
  }, [simulationId, setSimulationState]);
  
  const injectEvent = useCallback(async (eventType: string, data: any) => {
    if (!simulationId) return;
    await api.injectEvent(simulationId, eventType, data);
  }, [simulationId]);
  
  return { createAndStart, pause, resume, reset, step, injectEvent };
}
