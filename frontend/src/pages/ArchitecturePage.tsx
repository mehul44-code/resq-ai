import React from 'react';
import { useSimulationStore } from '../stores/simulationStore';

export const ArchitecturePage: React.FC = () => {
  const { setPage } = useSimulationStore();
  
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-sky-400">AI Agent Architecture</h1>
          <button onClick={() => setPage('mission')} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm font-mono hover:bg-slate-600">
            ← Mission
          </button>
        </div>
        
        {/* PEAS */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { title: 'Performance Measures', items: ['Victims rescued', 'Mission time', 'Battery efficiency', 'Route safety', 'Successful replanning', 'Critical victims saved'], color: 'border-sky-700 bg-sky-900/20' },
            { title: 'Environment', items: ['30×20 disaster grid', 'Dynamic fire/smoke/hazards', 'Victims with health states', 'Walls/obstacles/safe zones', 'Charging stations', 'Random seed events'], color: 'border-green-700 bg-green-900/20' },
            { title: 'Actuators', items: ['Move (8-directional A*)', 'Rescue victim', 'Return to base', 'Charge battery', 'Wait/Abort', 'Replan path'], color: 'border-purple-700 bg-purple-900/20' },
            { title: 'Sensors / Perception', items: ['Full grid state awareness', 'Victim health & urgency', 'Hazard positions & intensity', 'Robot battery & position', 'Simulation clock', 'Path validity checks'], color: 'border-orange-700 bg-orange-900/20' },
          ].map(({ title, items, color }) => (
            <div key={title} className={`rounded-xl p-4 border ${color}`}>
              <h3 className="font-bold text-sm mb-3 text-slate-200">{title}</h3>
              <ul className="space-y-1">
                {items.map(item => (
                  <li key={item} className="text-xs text-slate-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Agent Loop */}
        <div className="bg-slate-800/60 rounded-xl p-6 border border-slate-700 mb-6">
          <h3 className="font-bold text-sm mb-4 text-slate-200">Agent Decision Loop</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {['PERCEPTION', 'SITUATION ANALYSIS', 'VICTIM TRIAGE', 'RISK ASSESSMENT', 'A* PLANNING', 'DECISION', 'ACTION', 'FEEDBACK', 'REPLAN'].map((step, i, arr) => (
              <React.Fragment key={step}>
                <div className="bg-slate-900 border border-sky-800 rounded-lg px-3 py-2 text-xs font-mono text-sky-300 font-bold">
                  {step}
                </div>
                {i < arr.length - 1 && <span className="text-slate-600">→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        {/* Technology Stack */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { title: 'Backend', items: ['Python 3.11+', 'FastAPI', 'SQLAlchemy + SQLite', 'Pydantic v2', 'WebSockets', 'Custom A* Planner'] },
            { title: 'Frontend', items: ['React 18 + TypeScript', 'Vite', 'Tailwind CSS', 'Zustand', 'Recharts', 'Canvas API'] },
            { title: 'AI Engine', items: ['Utility-based triage', 'A* pathfinding', 'Safety constraint layer', 'Dynamic replanning', 'Explainability module', 'Metrics engine'] },
          ].map(({ title, items }) => (
            <div key={title} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
              <h3 className="font-bold text-sm mb-3 text-slate-200">{title}</h3>
              <ul className="space-y-1">
                {items.map(item => (
                  <li key={item} className="text-xs text-slate-400">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
