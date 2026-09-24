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
  
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMapSize({ w: Math.floor(rect.width), h: Math.floor(rect.height) });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
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
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <div>
            <div className="text-sky-400 font-bold text-sm tracking-wide">ResQ-AI</div>
            <div className="text-slate-500 text-xs">AI Rescue Robot — Disaster Management Agent</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm">{scenario?.name || 'No Scenario'}</span>
          <span className={clsx('px-2 py-0.5 rounded text-xs font-mono font-bold', STATUS_BADGE[simStatus])}>
            {simStatus}
          </span>
          {simulationState?.tick !== undefined && (
            <span className="text-slate-500 text-xs font-mono">T={simulationState.tick}</span>
          )}
        </div>
        
        <div className="flex items-center gap-1.5">
          <button onClick={handleStart}
            className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white text-xs rounded font-mono font-bold transition-colors">
            ▶ START
          </button>
          <button onClick={sim.pause}
            className="px-3 py-1.5 bg-yellow-700 hover:bg-yellow-600 text-white text-xs rounded font-mono transition-colors">
            ⏸ PAUSE
          </button>
          <button onClick={sim.resume}
            className="px-3 py-1.5 bg-sky-700 hover:bg-sky-600 text-white text-xs rounded font-mono transition-colors">
            ▶ RESUME
          </button>
          <button onClick={sim.step}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded font-mono transition-colors">
            ▶| STEP
          </button>
          <button onClick={sim.reset}
            className="px-3 py-1.5 bg-red-900 hover:bg-red-800 text-white text-xs rounded font-mono transition-colors">
            ↺ RESET
          </button>
          <div className="w-px h-5 bg-slate-700 mx-1" />
          <button onClick={() => store.setPage('scenarios')}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded font-mono transition-colors">
            SCENARIOS
          </button>
          {store.simulationId && (
            <button onClick={() => store.setPage('results')}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded font-mono transition-colors">
              RESULTS
            </button>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Disaster Map */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div ref={containerRef} className="flex-1 bg-slate-950 overflow-hidden relative">
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
          </div>
          
          {/* Bottom: Event Timeline */}
          <div className="h-36 bg-slate-900 border-t border-slate-700 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-800">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Event Timeline</span>
              <span className="text-xs text-slate-600">({events.filter(e => !['tick_updated', 'battery_updated'].includes(e.event_type)).length} events)</span>
            </div>
            <EventTimeline events={events} />
          </div>
        </div>
        
        {/* Right Panel */}
        <div className="w-72 bg-slate-900 border-l border-slate-700 flex flex-col overflow-hidden">
          {/* AI Decision Panel */}
          <div className="flex-1 overflow-y-auto p-3">
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
          
          {/* Victims / Events Tabs */}
          <div className="border-t border-slate-700">
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
            <div className="h-52 overflow-y-auto p-2">
              {activeTab === 'victims' ? (
                <VictimList victims={simulationState?.victims || {}} currentTarget={robot?.current_target || null} />
              ) : (
                <EventTimeline events={events} maxVisible={20} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
