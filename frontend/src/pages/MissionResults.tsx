import React, { useEffect } from 'react';
import { useSimulationStore } from '../stores/simulationStore';
import { MetricsPanel } from '../components/MetricsPanel';
import { api } from '../services/api';

export const MissionResults: React.FC = () => {
  const store = useSimulationStore();
  const metrics = store.metrics;
  const { setMetrics } = store;
  const rescuedRate = metrics ? Math.round(metrics.mission_completion_rate) : 0;
  
  useEffect(() => {
    if (store.simulationId && !metrics) {
      api.getMetrics(store.simulationId).then(setMetrics).catch(console.error);
    }
  }, [store.simulationId, metrics, setMetrics]);
  
  return (
    <div className="results-page text-slate-100">
      <div className="results-frame">
        <header className="product-bar">
          <button className="brand-lockup" onClick={() => store.setPage('mission')} aria-label="Open mission dashboard">
            <span className="brand-mark">R</span><span><strong>RESQ-AI</strong><small>Mission intelligence report</small></span>
          </button>
          <div className="results-nav"><button onClick={() => store.setPage('mission')}>Mission dashboard</button><button onClick={() => store.setPage('decisions')}>Decision log</button></div>
        </header>
        {metrics ? <>
          <section className="results-heading"><div><p className="eyebrow">Post-mission analysis / {metrics.scenario_name}</p><h1>Mission complete.</h1><p>Performance telemetry from the autonomous response run.</p></div><div className="result-status"><span className="status-dot" /> VERIFIED RUN</div></section>
          <section className="score-overview"><div className="score-number"><span>MISSION SCORE</span><strong>{metrics.mission_score.toFixed(1)}</strong><small>out of 100</small></div><div className="completion-ring" style={{ '--completion': `${rescuedRate}%` } as React.CSSProperties}><strong>{rescuedRate}%</strong><span>survival<br />completion</span></div><div className="score-summary"><p>RESCUE OUTCOME</p><strong>{metrics.rescued_victims} <span>/ {metrics.total_victims}</span></strong><small>victims safely recovered</small></div></section>
          <MetricsPanel metrics={metrics} />
          <div className="results-actions"><button className="primary-action" onClick={() => store.setPage('scenarios')}>Run another scenario <span>→</span></button><button className="secondary-action" onClick={() => store.setPage('decisions')}>Review AI decisions</button></div>
        </> : <div className="empty-results"><span className="empty-symbol">◌</span><h1>No mission report yet.</h1><p>Launch a scenario to generate scored rescue telemetry.</p><button className="primary-action" onClick={() => store.setPage('scenarios')}>Browse scenarios <span>→</span></button></div>}
      </div>
    </div>
  );
};
