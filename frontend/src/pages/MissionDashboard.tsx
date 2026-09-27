import React, { useState, useEffect, useRef } from 'react';
import { useSimulationStore } from '../stores/simulationStore';
import { useSimulation } from '../hooks/useSimulation';
import { DisasterMap } from '../components/DisasterMap';
import { AIDecisionPanel } from '../components/AIDecisionPanel';
import { EventTimeline } from '../components/EventTimeline';
import { VictimList } from '../components/VictimList';
import { api } from '../services/api';
import { clsx } from 'clsx';

const STATUS_BADGE: Record<string, string> = {
  IDLE: 'bg-slate-700 text-slate-300',
  RUNNING: 'bg-green-900 text-green-400 animate-pulse',
  PAUSED: 'bg-yellow-900 text-yellow-400',
  COMPLETED: 'bg-blue-900 text-blue-400',
  ABORTED: 'bg-red-900 text-red-400',
};
const CONNECTION_BADGE: Record<string, string> = {
  CONNECTED: 'text-green-400',
  CONNECTING: 'text-yellow-400',
  RECONNECTING: 'text-orange-400',
  DISCONNECTED: 'text-slate-500',
  ERROR: 'text-red-400',
};

export const MissionDashboard: React.FC = () => {
  const store = useSimulationStore();
  const sim = useSimulation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapSize, setMapSize] = useState({ w: 800, h: 500 });
  const [activeTab, setActiveTab] = useState<'victims' | 'events'>('events');
  
  const { simulationState, events, decisions, simulationId } = store;
  const robot = simulationState?.robot || null;
  const lastDecision = decisions.length > 0 ? decisions[decisions.length - 1] : null;
  const simStatus = simulationState?.status || 'IDLE';
  const victims = Object.values(simulationState?.victims || {});
  const activeVictims = victims.filter(victim => !victim.rescued).length;
  const activeHazards = Object.values(simulationState?.hazards || {}).length;
  
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMapSize({ w: Math.max(1, Math.floor(rect.width)), h: Math.max(1, Math.floor(rect.height)) });
      }
    };
    update();
    const observer = new ResizeObserver(update);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);
  
  const handleStart = async () => {
    if (!simulationId) {
      await sim.createAndStart(store.selectedScenarioId);
      store.setPage('mission');
    } else {
      await api.startSimulation(simulationId);
    }
  };
  
  const scenario = store.scenarios.find(s => s.id === store.selectedScenarioId);
  
  return (
    <div className="dashboard-shell text-slate-100">
      <header className="dashboard-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-950/40">
            <span className="text-white font-bold text-lg">R</span>
          </div>
          <div>
            <div className="text-sky-300 font-extrabold text-lg tracking-wide">RESQ-AI</div>
            <div className="text-slate-500 text-[11px] uppercase tracking-[0.14em]">AI Rescue Robot · Disaster Management Agent</div>
          </div>
        </div>

        <div className="header-scenario flex items-center gap-3 min-w-0">
          <span className="text-slate-300 text-sm font-semibold truncate">{scenario?.name || 'No Scenario'}</span>
          <span className={clsx('px-2 py-0.5 rounded text-xs font-mono font-bold', STATUS_BADGE[simStatus])}>
            {simStatus}
          </span>
          <span className={clsx('text-xs font-mono font-bold', CONNECTION_BADGE[store.connectionStatus])}>
            ● {store.connectionStatus}
          </span>
          {simulationState?.tick !== undefined && (
            <span className="text-slate-500 text-xs font-mono">T={simulationState.tick}</span>
          )}
        </div>

        <div className="header-controls flex items-center justify-end gap-1.5 min-w-0">
          <button onClick={handleStart} aria-label="Start simulation" className="control-button control-primary">
            ▶ START
          </button>
          <button onClick={sim.pause} aria-label="Pause simulation" className="control-button control-neutral">
            ⏸ PAUSE
          </button>
          <button onClick={sim.resume} aria-label="Resume simulation" className="control-button control-secondary">
            ▶ RESUME
          </button>
          <button onClick={sim.step} aria-label="Advance one simulation step" className="control-button control-neutral">
            ▶| STEP
          </button>
          <button onClick={sim.reset} aria-label="Reset simulation" className="control-button control-danger">
            ↺ RESET
          </button>
          <button onClick={() => store.setPage('scenarios')} className="control-button control-neutral">
            SCENARIOS
          </button>
          {store.simulationId && (
            <button onClick={() => store.setPage('results')} className="control-button control-neutral">
              RESULTS
            </button>
          )}
        </div>
      </header>

      {store.error && (
        <div className="px-4 py-2 bg-red-950/70 border-b border-red-800 text-red-300 text-xs font-mono">
          Backend error: {store.error}
        </div>
      )}

      <div className="dashboard-command-bar">
        <div className="command-stat">
          <span className="command-label">Mission</span>
          <strong>{scenario?.name || 'Awaiting Scenario'}</strong>
        </div>
        <div className="command-stat">
          <span className="command-label">Battery</span>
          <strong className={robot?.battery && robot.battery <= 25 ? 'text-red-400' : 'text-emerald-400'}>{robot ? `${robot.battery.toFixed(0)}%` : '—'}</strong>
        </div>
        <div className="command-stat">
          <span className="command-label">Threats</span>
          <strong>{activeHazards}</strong>
        </div>
        <div className="command-stat">
          <span className="command-label">Score</span>
          <strong>{store.metrics?.mission_score?.toFixed(0) ?? '30'}</strong>
        </div>
      </div>

      <main className="dashboard-main">
        <div className="map-panel">
          <div className="map-caption"><span><strong>LIVE OPERATIONS MAP</strong><small>{scenario?.name || 'Awaiting scenario'} · {simulationState?.grid[0]?.length || 30} × {simulationState?.grid.length || 20} grid</small></span><span className="map-live"><i /> LIVE FEED</span></div>
          <div ref={containerRef} className="map-viewport">
            {simulationState?.grid && simulationState.grid.length > 0 ? (
              <DisasterMap
                grid={simulationState.grid}
                robot={robot}
                victims={simulationState.victims || {}}
                width={mapSize.w}
                height={mapSize.h}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">🤖</div>
                  <div className="text-slate-400 text-lg font-mono">ResQ-AI Ready</div>
                  <div className="text-slate-600 text-sm mt-2">Select a scenario and press START</div>
                  <button
                    onClick={() => store.setPage('scenarios')}
                    className="mt-4 px-6 py-2 bg-sky-700 hover:bg-sky-600 text-white rounded-lg font-mono text-sm transition-colors"
                  >
                    Select Scenario
                  </button>
                </div>
              </div>
            )}
            <div className="map-legend" aria-label="Map legend">
              <span><i className="legend-swatch legend-robot" />ROBOT</span>
              <span><i className="legend-swatch legend-victim" />VICTIM</span>
              <span><i className="legend-swatch legend-hazard" />HAZARD</span>
              <span><i className="legend-swatch legend-base" />BASE</span>
            </div>
            <div className="map-readout"><span>UNRESCUED <strong>{activeVictims}</strong></span><span>HAZARD ZONES <strong>{activeHazards}</strong></span></div>
          </div>
        </div>

        <aside className="ai-panel">
          <div className="ai-panel-stack">
            <div className="ai-panel-section">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-sky-500 rounded-full"></span>
                AI Decision Panel
              </div>
              <AIDecisionPanel
                robot={robot}
                lastDecision={lastDecision}
                victims={simulationState?.victims || {}}
              />
            </div>

            <div className="ai-panel-section ai-panel-tabs">
              <div className="flex">
                {(['events', 'victims'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={clsx(
                      'flex-1 py-1.5 text-xs font-mono uppercase transition-colors',
                      activeTab === tab ? 'bg-slate-800 text-sky-400 border-b-2 border-sky-500' : 'text-slate-500 hover:text-slate-300'
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-2">
                {activeTab === 'victims' ? (
                  <VictimList victims={simulationState?.victims || {}} currentTarget={robot?.current_target || null} />
                ) : (
                  <EventTimeline events={events} maxVisible={20} />
                )}
              </div>
            </div>
          </div>
        </aside>
      </main>

      <div className="dashboard-bottom">
        <div className="timeline-panel">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-[0.16em]">Live Event Timeline</span>
            <span className="text-[11px] text-slate-500 font-mono">{events.filter(e => !['tick_updated', 'battery_updated'].includes(e.event_type)).length} events</span>
          </div>
          <div className="timeline-scroll"><EventTimeline events={events} /></div>
        </div>

        <div className="metrics-strip">
          {[
            ['RESCUED', store.metrics ? `${store.metrics.rescued_victims}/${store.metrics.total_victims}` : '—', 'text-green-400'],
            ['BATTERY', store.metrics ? `${store.metrics.battery_remaining.toFixed(0)}%` : robot ? `${robot.battery.toFixed(0)}%` : '—', 'text-yellow-400'],
            ['REPLANS', store.metrics?.replans_count ?? robot?.replans_count ?? 0, 'text-orange-400'],
            ['HAZARDS', store.metrics?.hazards_encountered ?? '—', 'text-red-400'],
            ['DISTANCE', store.metrics?.total_distance_traveled ?? robot?.total_distance ?? '—', 'text-purple-400'],
            ['SCORE', store.metrics?.mission_score.toFixed(0) ?? '—', 'text-cyan-400'],
          ].map(([label, value, color]) => (
            <div key={label} className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">
              <div className="text-[10px] text-slate-500 tracking-wider">{label}</div>
              <div className={clsx('text-lg font-bold font-mono', color)}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
