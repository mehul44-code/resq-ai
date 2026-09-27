import React, { useEffect, useState } from 'react';
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
  const { setScenarios } = store;
  const sim = useSimulation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    api.getScenarios().then(setScenarios).catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : 'Unable to load scenarios');
    });
  }, [setScenarios]);
  
  const handleLaunch = async (scenarioId: string) => {
    setLoading(true);
    setError(null);
    try {
      store.setSelectedScenario(scenarioId);
      await sim.createAndStart(scenarioId);
      store.setPage('mission');
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Unable to start simulation');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="selection-page text-slate-100">
      <div className="selection-frame">
        <header className="product-bar">
          <button className="brand-lockup" onClick={() => store.setPage('mission')} aria-label="Open mission dashboard">
            <span className="brand-mark">R</span>
            <span><strong>RESQ-AI</strong><small>Autonomous disaster response</small></span>
          </button>
          <div className="product-status"><span className="status-dot" /> SYSTEM READY <span className="status-divider" /> API CONNECTIVITY</div>
          <button onClick={() => store.setPage('mission')} className="quiet-button">Open dashboard</button>
        </header>

        <section className="selection-hero">
          <div>
            <p className="eyebrow">Mission control / scenario library</p>
            <h1>Choose the environment.<br /><span>Let the agent decide.</span></h1>
            <p className="hero-copy">Deploy an autonomous rescue robot into a live, hazard-aware environment. Every route, triage decision, and replan is recorded for review.</p>
          </div>
          <button disabled={loading} onClick={() => handleLaunch('demo')} className="demo-button">
            <span className="demo-icon">▶</span><span>{loading ? 'INITIALIZING...' : 'RUN COMPETITION DEMO'}<small>Recommended mission</small></span>
          </button>
        </section>

        <div className="selection-meta"><span>AVAILABLE SCENARIOS <strong>{store.scenarios.length || '—'}</strong></span><span>AI ENGINE <strong>ONLINE</strong></span><span>PLANNER <strong>A* / HAZARD-AWARE</strong></span></div>
        {error && <div className="mb-4 p-3 rounded-lg border border-red-800 bg-red-950/50 text-red-300 text-sm">{error}</div>}
        
        <div className="scenario-grid">
          {store.scenarios.map(scenario => (
            <div
              key={scenario.id}
              className={clsx(
                'scenario-card cursor-pointer transition-all',
                store.selectedScenarioId === scenario.id 
                  ? 'scenario-card-selected' 
                  : ''
              )}
              onClick={() => store.setSelectedScenario(scenario.id)}
            >
              <div className="scenario-card-top">
                <span className="scenario-index">0{store.scenarios.indexOf(scenario) + 1}</span>
                <span className={clsx('difficulty-pill', DIFFICULTY_COLORS[scenario.difficulty])}>
                  {scenario.difficulty}
                </span>
              </div>
              <div className="scenario-name">{scenario.name}</div>
              <p className="scenario-description">{scenario.description}</p>
              <div className="scenario-card-footer">
                <span className="scenario-grid-size">GRID {scenario.grid_cols} × {scenario.grid_rows}</span>
                <button
                  disabled={loading}
                  onClick={(e) => { e.stopPropagation(); handleLaunch(scenario.id); }}
                  className="launch-button"
                >
                  {loading ? 'STARTING...' : 'LAUNCH ▶'}
                </button>
              </div>
              {scenario.id === 'demo' && <div className="scenario-tag">★ CURATED DEMO ENVIRONMENT</div>}
            </div>
          ))}
        </div>
        {!store.scenarios.length && <div className="empty-scenarios">Connect to the simulation service to load mission environments.</div>}
      </div>
    </div>
  );
};
