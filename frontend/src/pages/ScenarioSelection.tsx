import React, { useEffect } from 'react';
import { useSimulationStore } from '../stores/simulationStore';
import { useSimulation } from '../hooks/useSimulation';
import { api } from '../services/api';
import { clsx } from 'clsx';

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'text-green-400 bg-green-900/30 border-green-800',
  Medium: 'text-yellow-400 bg-yellow-900/30 border-yellow-800',
  Hard: 'text-orange-400 bg-orange-900/30 border-orange-800',
  Expert: 'text-red-400 bg-red-900/30 border-red-800',
};

export const ScenarioSelection: React.FC = () => {
  const store = useSimulationStore();
  const sim = useSimulation();
  
  useEffect(() => {
    api.getScenarios().then(store.setScenarios).catch(console.error);
  }, []);
  
  const handleLaunch = async (scenarioId: string) => {
    store.setSelectedScenario(scenarioId);
    await sim.createAndStart(scenarioId);
    store.setPage('mission');
  };
  
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">R</span>
              </div>
              <h1 className="text-2xl font-bold text-sky-400">ResQ-AI</h1>
            </div>
            <p className="text-slate-400">AI Rescue Robot — Disaster Management Agent</p>
          </div>
          <button
            onClick={() => store.setPage('mission')}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-mono transition-colors"
          >
            ← Back to Mission
          </button>
        </div>
        
        <h2 className="text-xl font-bold mb-6 text-slate-200">Select Scenario</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {store.scenarios.map(scenario => (
            <div
              key={scenario.id}
              className={clsx(
                'bg-slate-800/60 rounded-xl p-4 border cursor-pointer transition-all hover:scale-[1.02]',
                store.selectedScenarioId === scenario.id 
                  ? 'border-sky-500 ring-1 ring-sky-500' 
                  : 'border-slate-700 hover:border-slate-500'
              )}
              onClick={() => store.setSelectedScenario(scenario.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="text-sm font-bold text-slate-100">{scenario.name}</div>
                <span className={clsx('text-xs px-2 py-0.5 rounded border font-mono', DIFFICULTY_COLORS[scenario.difficulty])}>
                  {scenario.difficulty}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">{scenario.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-mono">Grid: {scenario.grid_cols}×{scenario.grid_rows}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleLaunch(scenario.id); }}
                  className="px-3 py-1 bg-sky-700 hover:bg-sky-600 text-white text-xs rounded font-mono font-bold transition-colors"
                >
                  LAUNCH ▶
                </button>
              </div>
              {scenario.id === 'demo' && (
                <div className="mt-2 text-xs text-yellow-400 font-mono">⭐ Competition Demo Mode</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
