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
  }, [setScenarios]);
  
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
    <div className="app-root">
      {/* Page Content */}
      <div className={currentPage === 'mission' ? 'app-page' : 'app-page app-page-with-nav'}>
        {pages[currentPage] || <MissionDashboard />}
      </div>
      
      {/* Fixed Nav (shown on non-mission pages) */}
      {currentPage !== 'mission' && (
        <nav className="fixed top-0 left-0 right-0 z-50 app-nav">
          <button className="nav-brand" onClick={() => setPage('mission')}><span className="brand-mark">R</span> ResQ-AI</button>
          {navItems.map(({ page, label }) => (
            <button
              key={page}
              onClick={() => setPage(page)}
              className={`nav-item ${
                currentPage === page ? 'nav-item-active' : ''
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
