import React, { useEffect } from 'react';
import { useSimulationStore } from '../stores/simulationStore';
import { MetricsPanel } from '../components/MetricsPanel';
import { api } from '../services/api';

export const MissionResults: React.FC = () => {
  const store = useSimulationStore();
  
  useEffect(() => {
    if (store.simulationId && !store.metrics) {
      api.getMetrics(store.simulationId).then(store.setMetrics).catch(console.error);
    }
  }, [store.simulationId]);
  
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-sky-400">Mission Results</h1>
          <div className="flex gap-2">
            <button onClick={() => store.setPage('mission')} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm font-mono hover:bg-slate-600">
              ← Mission
            </button>
            <button onClick={() => store.setPage('decisions')} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm font-mono hover:bg-slate-600">
              Decision History →
            </button>
          </div>
        </div>
        {store.metrics ? <MetricsPanel metrics={store.metrics} /> : (
          <div className="text-center text-slate-500 py-20">No metrics available yet. Run a simulation first.</div>
        )}
      </div>
    </div>
  );
};
