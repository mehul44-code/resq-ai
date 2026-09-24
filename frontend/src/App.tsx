import React, { useEffect } from 'react';
import { useSimulationStore } from './stores/simulationStore';
import { MissionDashboard } from './pages/MissionDashboard';
import { ScenarioSelection } from './pages/ScenarioSelection';
import { MissionResults } from './pages/MissionResults';
import { DecisionHistory } from './pages/DecisionHistory';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { api } from './services/api';

export default function App() {
  const { currentPage, setScenarios, setPage } = useSimulationStore();
  
  useEffect(() => {
    api.getScenarios().then(setScenarios).catch(() => {
      console.warn('Backend not available - running in offline mode');
    });
  }, []);
  
  // Navigation bar
  const navItems = [
    { page: 'mission' as const, label: 'Mission' },
    { page: 'scenarios' as const, label: 'Scenarios' },
    { page: 'results' as const, label: 'Results' },
    { page: 'decisions' as const, label: 'Decisions' },
    { page: 'architecture' as const, label: 'Architecture' },
  ];
  
  const pages: Record<string, React.ReactNode> = {
    mission: <MissionDashboard />,
    scenarios: <ScenarioSelection />,
    results: <MissionResults />,
    decisions: <DecisionHistory />,
    architecture: <ArchitecturePage />,
  };
  
  return (
    <div className="relative">
      {/* Page Content */}
      {pages[currentPage] || <MissionDashboard />}
      
      {/* Fixed Nav (shown on non-mission pages) */}
      {currentPage !== 'mission' && (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center gap-1 bg-slate-900/95 backdrop-blur px-4 py-2 border-b border-slate-700">
          <div className="text-sky-400 font-bold text-sm mr-4">ResQ-AI</div>
          {navItems.map(({ page, label }) => (
            <button
              key={page}
              onClick={() => setPage(page)}
              className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                currentPage === page ? 'bg-sky-800 text-sky-200' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
