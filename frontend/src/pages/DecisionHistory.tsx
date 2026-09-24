import React from 'react';
import { useSimulationStore } from '../stores/simulationStore';


export const DecisionHistory: React.FC = () => {
  const { decisions, setPage } = useSimulationStore();
  
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-sky-400">Decision History</h1>
          <button onClick={() => setPage('mission')} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm font-mono hover:bg-slate-600">
            ← Mission
          </button>
        </div>
        
        {decisions.length === 0 ? (
          <div className="text-center text-slate-500 py-20">No decisions recorded yet.</div>
        ) : (
          <div className="space-y-3">
            {[...decisions].reverse().map((dec, i) => (
              <div key={i} className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sky-400 font-mono font-bold text-sm">{dec.selected_action}</span>
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
                
                <p className="text-slate-300 text-sm mb-2">{dec.explanation}</p>
                
                {dec.reason_codes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {dec.reason_codes.map((code, j) => (
                      <span key={j} className="text-xs px-2 py-0.5 bg-blue-900/40 text-blue-300 rounded font-mono">{code}</span>
                    ))}
                  </div>
                )}
                
                <div className="text-xs text-slate-500 font-mono">
                  {new Date(dec.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
