import React from 'react';
import { useSimulationStore } from '../stores/simulationStore';


export const DecisionHistory: React.FC = () => {
  const { decisions, setPage, simulationState } = useSimulationStore();
  
  return (
    <div className="history-page text-slate-100">
      <div className="history-frame">
        <header className="product-bar">
          <button className="brand-lockup" onClick={() => setPage('mission')} aria-label="Open mission dashboard">
            <span className="brand-mark">R</span><span><strong>RESQ-AI</strong><small>Decision intelligence log</small></span>
          </button>
          <button onClick={() => setPage('mission')} className="quiet-button">Back to mission</button>
        </header>
        <section className="history-heading"><div><p className="eyebrow">Audit trail / autonomous reasoning</p><h1>Every decision,<br /><span>made visible.</span></h1><p>Review the agent's choices, constraints, and selected targets across the mission.</p></div><div className="history-count"><strong>{decisions.length}</strong><span>decisions<br />recorded</span></div></section>
        <div className="history-meta"><span>MISSION TICK <strong>{simulationState?.tick ?? '—'}</strong></span><span>ROBOT <strong>{simulationState?.robot?.id ?? 'ROBOT_01'}</strong></span><span>STATUS <strong>{simulationState?.status ?? 'IDLE'}</strong></span></div>
        
        {decisions.length === 0 ? (
          <div className="empty-results"><span className="empty-symbol">◌</span><h1>No decisions recorded yet.</h1><p>Start a mission to see the agent's reasoning trail.</p><button className="primary-action" onClick={() => setPage('scenarios')}>Browse scenarios <span>→</span></button></div>
        ) : (
          <div className="decision-history-list">
            {[...decisions].reverse().map((dec, i) => (
              <div key={i} className="history-decision-card">
                <div className="history-decision-top">
                  <div className="flex items-center gap-2">
                    <span className="decision-index">{String(decisions.length - i).padStart(2, '0')}</span><span className="text-sky-400 font-mono font-bold text-sm">{dec.selected_action}</span>
                    {dec.selected_target && (
                      <span className="text-yellow-400 font-mono text-xs">→ {dec.selected_target}</span>
                    )}
                    {dec.replan_required && (
                      <span className="text-orange-400 text-xs bg-orange-900/40 px-2 py-0.5 rounded font-mono">REPLAN</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <span>T={dec.simulation_tick}</span>
                    <span>Score: {dec.priority_score.toFixed(1)}</span>
                  </div>
                </div>
                
                <p className="history-explanation">{dec.explanation}</p>
                
                {dec.reason_codes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {dec.reason_codes.map((code, j) => (
                      <span key={j} className="text-xs px-2 py-0.5 bg-blue-900/40 text-blue-300 rounded font-mono">{code}</span>
                    ))}
                  </div>
                )}
                
                <div className="history-decision-footer text-xs text-slate-500 font-mono">
                  {new Date(dec.timestamp).toLocaleTimeString()}
                  <span>BATTERY {dec.battery_before.toFixed(0)}% → {dec.battery_after.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
