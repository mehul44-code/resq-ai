import { useEffect, useCallback } from 'react';
import { useSimulationStore } from '../stores/simulationStore';
import { api } from '../services/api';
import { wsService } from '../services/websocket';
import type { WebSocketEvent } from '../types';

export function useSimulation() {
  const store = useSimulationStore();
  const { simulationId } = store;

  const handleWSEvent = useCallback((event: WebSocketEvent) => {
    const { type, data, tick, timestamp } = event;
    
    if (type === 'connected') {
      store.setConnected(true);
      if (data?.state) store.updateStateFromWS(data.state);
      return;
    }
    
    if (type === 'tick_updated') {
      store.updateStateFromWS(data);
      return;
    }
    
    if (type === 'decision_created' && data) {
      store.addDecision({
        timestamp: timestamp || new Date().toISOString(),
        simulation_tick: tick || 0,
        robot_state: 'ACTIVE',
        selected_action: data.action,
        selected_target: data.target,
        priority_score: data.score,
        reason_codes: data.reason_codes || [],
        explanation: data.explanation || '',
        battery_before: 0,
        battery_after: 0,
        replan_required: data.replan_required || false,
      });
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
    wsService.connect(simulationId);
    const unsub = wsService.on('*', handleWSEvent);
    store.setConnected(true);
    
    // Fetch initial state
    api.getState(simulationId).then(state => {
      store.setSimulationState(state);
    }).catch(console.error);
    
    return () => {
      unsub();
      wsService.disconnect();
      store.setConnected(false);
    };
  }, [simulationId]);
  
  const createAndStart = useCallback(async (scenarioId: string) => {
    try {
      const sim = await api.createSimulation(scenarioId);
      store.setSimulationId(sim.id);
      store.clearEvents();
      store.setMetrics(null as any);
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
  }, []);
  
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
