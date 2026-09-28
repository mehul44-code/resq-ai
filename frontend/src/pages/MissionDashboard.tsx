@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

* { box-sizing: border-box; }
body {
  margin: 0;
  background:
    radial-gradient(circle at top right, rgba(34, 211, 238, 0.12), transparent 22%),
    radial-gradient(circle at bottom left, rgba(34, 197, 94, 0.12), transparent 22%),
    #020617;
  color: #e2e8f0;
  font-family: 'Inter', sans-serif;
  overflow: auto;
}

html, body, #root { width: 100%; height: 100%; }

:root {
  --ink: #e8f0f7;
  --muted: #8da2b3;
  --faint: #526879;
  --line: rgba(129, 163, 184, 0.18);
  --panel: rgba(13, 29, 42, 0.82);
  --panel-strong: #0d1d2a;
  --cyan: #57d6e5;
  --lime: #b7dc68;
  --amber: #f4b860;
}

.selection-page, .results-page, .history-page, .architecture-page {
  min-height: 100vh;
  overflow: auto;
  background: radial-gradient(circle at 82% 12%, rgba(37, 104, 112, 0.18), transparent 32%), linear-gradient(135deg, #07131c 0%, #0a1b26 52%, #061017 100%);
}
.selection-frame, .results-frame { width: min(1280px, calc(100% - 48px)); margin: 0 auto; padding-bottom: 64px; }
.product-bar { min-height: 78px; display: flex; align-items: center; justify-content: space-between; gap: 24px; border-bottom: 1px solid var(--line); }
.brand-lockup, .nav-brand { display: inline-flex; align-items: center; gap: 11px; color: var(--ink); border: 0; background: transparent; cursor: pointer; text-align: left; }
.brand-lockup > span:last-child { display: flex; flex-direction: column; gap: 3px; }
.brand-lockup strong { font-size: 14px; letter-spacing: .16em; }
.brand-lockup small { color: var(--faint); font-family: 'JetBrains Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: .1em; }
.brand-mark { width: 32px; height: 32px; display: grid; place-items: center; color: #07131c; background: var(--cyan); border-radius: 9px; font-weight: 900; font-size: 17px; }
.product-status, .result-status { color: var(--muted); font: 10px 'JetBrains Mono', monospace; letter-spacing: .11em; }
.status-dot { width: 7px; height: 7px; display: inline-block; margin-right: 7px; border-radius: 50%; background: var(--lime); box-shadow: 0 0 12px rgba(183,220,104,.7); }
.status-divider { display: inline-block; height: 12px; margin: 0 12px; border-left: 1px solid var(--line); vertical-align: middle; }
.quiet-button, .results-nav button { border: 1px solid var(--line); border-radius: 7px; padding: 9px 13px; color: var(--muted); background: rgba(255,255,255,.03); font: 10px 'JetBrains Mono', monospace; cursor: pointer; transition: all 0.2s ease; }
.quiet-button:hover, .results-nav button:hover { color: var(--ink); border-color: rgba(87,214,229,.55); background: rgba(87,214,229,.08); }
.selection-hero { display: flex; align-items: end; justify-content: space-between; gap: 32px; padding: 34px 0 22px; }
.eyebrow { margin: 0 0 14px; color: var(--cyan); font: 10px 'JetBrains Mono', monospace; letter-spacing: .16em; text-transform: uppercase; }
.selection-hero h1, .results-heading h1 { margin: 0; color: var(--ink); font-size: clamp(34px, 5vw, 62px); line-height: .98; letter-spacing: -.045em; font-weight: 800; }
.selection-hero h1 span { color: var(--lime); }
.hero-copy { max-width: 570px; margin: 22px 0 0; color: var(--muted); line-height: 1.7; font-size: 14px; }
.demo-button { display: flex; align-items: center; gap: 14px; min-width: 260px; border: 1px solid rgba(183,220,104,.6); border-radius: 9px; padding: 15px 18px; color: #111b16; background: var(--lime); font-weight: 700; font-size: 11px; cursor: pointer; transition: all 0.2s ease; letter-spacing: .08em; }
.demo-button:hover { transform: translateY(-2px); box-shadow: 0 17px 34px rgba(183,220,104,.2); }
.demo-button:disabled { opacity: .6; cursor: wait; transform: none; }
.demo-button small { display: block; margin-top: 5px; color: rgba(17,27,22,.65); font-size: 9px; font-weight: 400; letter-spacing: .08em; }
.demo-icon { display: grid; place-items: center; width: 27px; height: 27px; border: 1px solid rgba(17,27,22,.3); border-radius: 50%; font-size: 10px; }
.selection-meta { display: flex; gap: 40px; margin-bottom: 18px; padding: 13px 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); color: var(--faint); font: 9px 'JetBrains Mono', monospace; letter-spacing: .1em; }
.selection-meta strong { margin-left: 8px; color: var(--muted); font-weight: 500; }
.scenario-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.scenario-card { min-height: 160px; display: flex; flex-direction: column; padding: 14px; border: 1px solid var(--line); border-radius: 10px; background: linear-gradient(145deg, rgba(17,39,53,.88), rgba(12,25,36,.78)); cursor: pointer; transition: all 0.2s ease; }
.scenario-card:hover { border-color: rgba(87,214,229,.5); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(87,214,229,.1); }
.scenario-card-selected { border-color: var(--cyan); box-shadow: inset 0 0 0 1px rgba(87,214,229,.3), 0 12px 30px rgba(0,0,0,.18); background: linear-gradient(145deg, rgba(17,59,80,.95), rgba(12,35,50,.85)); }
.scenario-card-top, .scenario-card-footer { display: flex; align-items: center; justify-content: space-between; }
.scenario-index { color: var(--faint); font: 11px 'JetBrains Mono', monospace; }
.difficulty-pill { padding: 4px 8px; border: 1px solid currentColor; border-radius: 5px; font: 9px 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: .08em; font-weight: 600; }
.scenario-name { margin-top: 12px; color: var(--ink); font-size: 15px; font-weight: 700; letter-spacing: -.02em; line-height: 1.3; }
.scenario-description { min-height: 35px; margin: 6px 0 8px; color: var(--muted); font-size: 11px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.scenario-card-footer { margin-top: auto; padding-top: 14px; border-top: 1px solid rgba(129,163,184,.1); }
.scenario-grid-size { color: var(--faint); font: 9px 'JetBrains Mono', monospace; letter-spacing: .1em; }
.launch-button { border: 0; color: var(--cyan); background: transparent; font: 700 11px 'JetBrains Mono', monospace; cursor: pointer; transition: all 0.2s ease; letter-spacing: .05em; }
.launch-button:hover { color: var(--ink); transform: translateX(2px); }
.launch-button:disabled { opacity: 0.5; cursor: not-allowed; }
.scenario-tag { margin-top: 12px; color: var(--amber); font: 9px 'JetBrains Mono', monospace; letter-spacing: .08em; font-weight: 600; }
.empty-scenarios, .empty-results { padding: 70px 20px; color: var(--muted); text-align: center; }
.results-nav { display: flex; gap: 8px; }
.results-heading { display: flex; justify-content: space-between; align-items: end; padding: 66px 0 35px; }
.results-heading > div:first-child > p:last-child { margin: 15px 0 0; color: var(--muted); font-size: 14px; }
.score-overview { display: grid; grid-template-columns: 1.1fr 1fr 1fr; align-items: center; gap: 20px; margin-bottom: 20px; padding: 28px; border: 1px solid var(--line); border-radius: 12px; background: rgba(15,23,42,.5); }
.score-number span, .score-summary p { display: block; color: var(--faint); font: 10px 'JetBrains Mono', monospace; letter-spacing: .14em; }
.score-number strong { display: block; margin: 6px 0; color: var(--lime); font: 700 62px 'JetBrains Mono', monospace; letter-spacing: -.08em; }
.score-number small, .score-summary small { color: var(--muted); font-size: 11px; }
.completion-ring { width: 128px; height: 128px; display: grid; place-content: center; justify-items: center; border-radius: 50%; background: radial-gradient(circle at center, #0b1a24 58%, transparent 100%); border: 2px solid var(--cyan); }
.completion-ring strong { color: var(--cyan); font: 25px 'JetBrains Mono', monospace; }
.completion-ring span { color: var(--muted); font-size: 9px; text-align: center; text-transform: uppercase; letter-spacing: .08em; }
.score-summary strong { display: block; margin: 8px 0; color: var(--ink); font: 700 34px 'JetBrains Mono', monospace; }
.score-summary strong span { color: var(--faint); font-size: 20px; }
.results-actions { display: flex; gap: 10px; margin-top: 24px; }
.primary-action, .secondary-action { border-radius: 7px; padding: 12px 16px; font: 700 10px 'JetBrains Mono', monospace; cursor: pointer; transition: all 0.2s ease; }
.app-nav { position: fixed; z-index: 50; top: 0; left: 0; right: 0; display: flex; align-items: center; gap: 4px; padding: 10px 22px; border-bottom: 1px solid var(--line); background: rgba(7,19,28,.95); backdrop-filter: blur(8px); }
.app-page { min-width: 0; min-height: 100%; }
.app-page-with-nav { height: 100dvh; min-height: 0; padding-top: 48px; overflow-y: auto; overflow-x: hidden; }
.app-page-with-nav { scrollbar-gutter: stable; }
.app-page-with-nav::-webkit-scrollbar { width: 10px; }
.app-page-with-nav::-webkit-scrollbar-track { background: rgba(15, 23, 42, .75); }
.app-page-with-nav::-webkit-scrollbar-thumb { border: 2px solid rgba(15, 23, 42, .75); border-radius: 8px; background: #3b6175; }
.app-page-with-nav::-webkit-scrollbar-thumb:hover { background: var(--cyan); }
.app-page-with-nav > .selection-page,
.app-page-with-nav > .results-page,
.app-page-with-nav > .history-page,
.app-page-with-nav > .architecture-page { min-height: calc(100dvh - 48px); }
.history-page, .architecture-page { min-height: 100vh; overflow: auto; background: radial-gradient(circle at 82% 12%, rgba(37,104,112,.15), transparent 32%), linear-gradient(135deg, #07131c, #0a1b26, #061017); }

@media (max-width: 1280px) { 
  .scenario-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
}
@media (max-width: 1024px) { 
  .scenario-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; }
}
@media (max-width: 768px) { 
  .scenario-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }
  .scenario-card { min-height: 140px; padding: 10px; }
  .scenario-name { font-size: 13px; margin-top: 8px; }
  .scenario-description { font-size: 10px; min-height: 28px; }
}

button { font-family: inherit; }

.dashboard-shell {
  width: 100vw;
  height: 100dvh;
  min-height: 320px;
  min-width: 0;
  display: grid;
  grid-template-rows: 72px auto minmax(280px, 1fr) 150px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(2,6,23,1) 0%, rgba(8,15,26,1) 100%);
}

.dashboard-header {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(250px, 1fr) auto minmax(420px, 1.35fr);
  align-items: center;
  gap: 20px;
  padding: 0 22px;
  min-height: 72px;
  background: rgba(15, 23, 42, 0.92);
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
  backdrop-filter: blur(18px);
  box-shadow: 0 12px 30px rgba(2,6,23,0.3);
}

.dashboard-command-bar {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  padding: 14px 18px 0;
}

.command-stat {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 12px 14px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.68));
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 12px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
}

.command-label {
  color: #64748b;
  font-size: 9px;
  letter-spacing: 0.15em;
  font-family: 'JetBrains Mono', monospace;
  text-transform: uppercase;
}

.command-stat strong {
  color: #e2e8f0;
  font-size: 1rem;
  letter-spacing: -0.04em;
  font-weight: 700;
}

.dashboard-main {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(360px, 0.8fr);
  gap: 14px;
  padding: 14px 18px;
  overflow: hidden;
}

.map-panel {
  position: relative;
  min-width: 0;
  min-height: 0;
  display: flex;
  overflow: hidden;
  border: 1px solid #1e293b;
  border-radius: 14px;
  background: #020617;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
}

.map-caption { position: absolute; z-index: 2; inset: 0 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: linear-gradient(180deg, rgba(2, 6, 23, 0.92), transparent); }
.map-caption strong, .map-caption small { display: block; }
.map-caption strong { color: #dbeafe; font: 10px 'JetBrains Mono', monospace; letter-spacing: .13em; }
.map-caption small { margin-top: 4px; color: #64748b; font: 9px 'JetBrains Mono', monospace; letter-spacing: .08em; }
.map-legend { position: absolute; z-index: 2; left: 14px; bottom: 14px; display: flex; gap: 12px; padding: 8px 10px; border: 1px solid rgba(148,163,184,.18); border-radius: 6px; background: rgba(15, 23, 42, 0.9); font: 9px 'JetBrains Mono', monospace; color: #cbd5e1; }
.legend-swatch { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 5px; }
.legend-robot { background: #38bdf8; }
.legend-victim { background: #fbbf24; }
.legend-hazard { background: #f97316; }
.legend-base { background: #3b82f6; }
.map-readout { position: absolute; z-index: 2; right: 14px; bottom: 14px; display: flex; gap: 16px; color: #64748b; font: 9px 'JetBrains Mono', monospace; pointer-events: none; }
.map-readout strong { color: #e2e8f0; font-weight: 600; }

.map-viewport {
  position: relative;
  min-width: 0;
  min-height: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.ai-panel {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid #1e293b;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(8, 15, 30, 0.98));
}

.ai-panel-stack {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 0;
  min-width: 0;
  height: 100%;
}

.ai-panel-header {
  min-width: 0;
  min-height: 0;
  padding: 12px 12px 10px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
}

.ai-panel-body {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.ai-panel-section {
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.ai-panel-tabs {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
}

.ai-panel-tabs > .ai-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  min-width: 0;
  min-height: 0;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.ai-panel-tabs > .ai-tabs > button {
  padding: 8px 12px;
  font-size: 11px;
  border: none;
  background: transparent;
  color: #64748b;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.ai-panel-tabs > .ai-tabs > button:hover {
  background: rgba(148, 163, 184, 0.05);
  color: #cbd5e1;
}

.ai-panel-tabs > .ai-tabs > button.bg-slate-800 {
  background: #1e293b;
  color: #38bdf8;
  border-bottom-color: #38bdf8;
}

.ai-tab-content {
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
}

.ai-decision-panel {
  display: grid;
  grid-template-rows: auto auto auto auto auto minmax(0, 1fr);
  gap: 8px;
  min-width: 0;
  min-height: 0;
  height: 100%;
  padding: 12px;
  overflow: hidden;
}

.ai-decision-section {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.6);
  overflow: hidden;
}

.ai-decision-alert {
  background: rgba(120, 53, 15, 0.3);
  border-color: rgba(251, 146, 60, 0.4);
}

.ai-decision-scrollable {
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.dashboard-bottom {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.55fr);
  gap: 14px;
  padding: 0 18px 14px;
  overflow: hidden;
}

.timeline-panel {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #1e293b;
  border-radius: 12px;
  background: #0f172a;
}

.metrics-strip {
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(100px, 1fr));
  gap: 8px;
  align-content: center;
  padding: 12px;
  border: 1px solid #1e293b;
  border-radius: 12px;
  background: #0f172a;
}

.control-button {
  min-height: 34px;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 0 11px;
  color: #e2e8f0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
  transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.2);
  cursor: pointer;
}

.control-button:hover { transform: translateY(-1px); }
.control-button:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }
.control-button:disabled { cursor: not-allowed; opacity: 0.5; transform: none; }
.control-primary { background: #047857; border-color: #10b981; }
.control-primary:hover { background: #059669; }
.control-secondary { background: #075985; border-color: #0284c7; }
.control-secondary:hover { background: #0369a1; }
.control-neutral { background: #1e293b; border-color: #334155; }
.control-neutral:hover { background: #334155; }
.control-danger { background: #7f1d1d; border-color: #b91c1c; }
.control-danger:hover { background: #991b1b; }

.timeline-scroll {
  height: calc(100% - 38px);
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

@media (max-width: 1100px) {
  .dashboard-header { grid-template-columns: 1fr auto; }
  .header-scenario { display: none; }
  .dashboard-main { grid-template-columns: minmax(0, 1fr) minmax(320px, 0.7fr); }
}

@media (max-width: 820px) {
  .dashboard-shell { grid-template-rows: auto minmax(0, 1fr) auto; }
  .dashboard-header { grid-template-columns: 1fr; gap: 4px; padding: 10px 14px; }
  .header-controls { overflow-x: auto; }
  .dashboard-main { grid-template-columns: minmax(0, 1fr); overflow-y: auto; }
  .map-panel { min-height: 420px; }
  .ai-panel { max-height: 430px; }
  .dashboard-bottom { grid-template-columns: 1fr; }
  .metrics-strip { min-width: 0; }
}

@media (max-height: 600px) and (min-width: 821px) {
  .dashboard-header { min-height: 58px; gap: 10px; padding: 0 14px; }
  .dashboard-header .w-10 { width: 30px; height: 30px; }
  .dashboard-header .text-lg { font-size: 14px; }
  .dashboard-header .text-\[11px\] { display: none; }
  .dashboard-main { gap: 10px; padding: 10px 14px; }
  .dashboard-bottom { grid-template-columns: 1fr; padding: 0 14px 8px; }
  .timeline-panel { display: none; }
  .metrics-strip { grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 5px; padding: 6px; }
  .metrics-strip > div { padding: 5px 6px; }
  .metrics-strip .text-lg { font-size: 13px; }
  .ai-panel { padding: 0; }
}

@media (max-height: 600px) and (min-width: 600px) {
  .dashboard-header { min-height: 58px; gap: 4px; padding: 8px 14px; }
  .dashboard-header .text-\[11px\] { display: none; }
  .dashboard-main { grid-template-columns: minmax(0, 1.35fr) minmax(230px, .8fr); gap: 8px; padding: 8px 14px; overflow: hidden; }
  .map-panel { min-height: 0; }
  .ai-panel { max-height: none; padding: 0; }
  .dashboard-bottom { grid-template-columns: 1fr; padding: 0 14px 7px; }
  .timeline-panel { display: none; }
  .metrics-strip { grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 4px; padding: 5px; }
  .metrics-strip > div { padding: 4px 5px; }
  .metrics-strip .text-lg { font-size: 12px; }
}

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #0f172a; }
::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #475569; }

.grid-cell { transition: background-color 0.2s ease; }
.pulse-animation { animation: pulse 1.5s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

.robot-glow { filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.8)); animation: robot-pulse 1s ease-in-out infinite; }
@keyframes robot-pulse { 0%, 100% { filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.8)); } 50% { filter: drop-shadow(0 0 16px rgba(56, 189, 248, 1)); } }

.fire-cell { animation: fire-flicker 0.5s ease-in-out infinite alternate; }
@keyframes fire-flicker { 0% { background-color: #dc2626; } 100% { background-color: #f97316; } }

