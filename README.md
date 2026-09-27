# 🤖 ResQ-AI — AI Rescue Robot: Disaster Management Agent

<div align="center">

![ResQ-AI Banner](docs/assets/banner.png)

**An autonomous AI rescue-agent simulation for disaster environments.**  
Built for the college AI competition — demonstrates real intelligent-agent behavior, not scripted animations.

[![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)

</div>

---

## 📋 Table of Contents

- [Problem Statement](#problem-statement)
- [What Makes This AI?](#what-makes-this-ai)
- [Agent Architecture](#agent-architecture)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Running the Backend](#running-the-backend)
- [Running the Frontend](#running-the-frontend)
- [Running Tests](#running-tests)
- [Scenario Configuration](#scenario-configuration)
- [AI Decision Flow](#ai-decision-flow)
- [Architecture Diagram](#architecture-diagram)
- [Demo Procedure](#demo-procedure)
- [Limitations](#limitations)
- [Future Scope](#future-scope)

---

## Problem Statement

In real-world disasters — building fires, earthquakes, structural collapses — first responders face:

- **Multiple victims** with different medical urgencies
- **Dynamic environments** where conditions change (fire spreads, routes collapse)
- **Resource constraints** (time, energy, access)
- **Conflicting priorities** (nearest victim ≠ most urgent victim)

ResQ-AI simulates an **autonomous AI rescue robot** that can perceive, reason, plan, act, and replan under these conditions — demonstrating utility-based decision-making, A* pathfinding, and dynamic replanning in a real-time interactive visualization.

---

## What Makes This AI?

ResQ-AI is a **utility-based autonomous agent** (not a scripted animation):

| Property | Implementation |
|----------|----------------|
| **Perceives** the environment | Full grid state awareness every tick |
| **Evaluates** victims | Multi-factor priority scoring (severity, urgency, hazard, accessibility) |
| **Plans** paths | A* algorithm with hazard-weighted costs |
| **Decides** autonomously | Decision engine with structured reason codes |
| **Acts** in the environment | Moves, rescues, avoids, replans |
| **Replans** when conditions change | Fire spread → path invalidation → replan |
| **Explains** every decision | Human-readable explanations from reason codes |
| **Measures** performance | Real calculated metrics, not fake values |

---

## Agent Architecture

```
DISASTER ENVIRONMENT (30×20 grid)
         │
         ▼
    PERCEPTION LAYER
    ├── Grid state sensor
    ├── Victim state sensor  
    ├── Hazard sensor
    └── Battery/robot sensor
         │
         ▼
  SITUATION ANALYZER
  ├── VICTIM TRIAGE ENGINE
  │   ├── Medical severity score
  │   ├── Time criticality score
  │   ├── Deterioration risk score
  │   ├── Hazard exposure score
  │   └── Accessibility score
  │
  ├── A* PATH PLANNER
  │   ├── Hazard-weighted cost function
  │   ├── Fire penalty (blocks path)
  │   ├── Smoke penalty (slows movement)
  │   └── Battery feasibility check
  │
  └── SAFETY ENGINE
      ├── Route safety validation
      ├── Battery reserve check
      └── Emergency condition detection
         │
         ▼
  DECISION ENGINE
  ├── Action selection (10 possible actions)
  ├── Reason code generation
  └── Explanation generation
         │
         ▼
   ROBOT ACTION ENGINE
   ├── Move (A* path execution)
   ├── Rescue (multi-tick action)
   ├── Return to base
   └── Charge
         │
         ▼
  ENVIRONMENT UPDATE
  ├── Fire spread (deterministic RNG)
  ├── Victim health deterioration
  ├── Hazard severity changes
  └── Path validity re-check
         │
         ▼
   FEEDBACK LOOP
   ├── Path invalidation detection → REPLAN
   ├── Decision logging
   ├── Event broadcasting (WebSocket)
   └── Metrics calculation
```

### PEAS Representation

| Component | Details |
|-----------|---------|
| **P**erformance | Victims rescued, time efficiency, battery efficiency, route safety, successful replanning, mission score (0-100) |
| **E**nvironment | 30×20 disaster grid, dynamic fire/smoke/hazards, multiple victims, walls/obstacles, charging stations |
| **A**ctuators | Move, Rescue, Return to Base, Charge, Wait, Abort, Replan |
| **S**ensors | Full grid awareness, victim health/urgency/severity, hazard positions/intensity, robot battery/position, simulation clock |

---

## Technology Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| Python 3.11+ | Core language |
| FastAPI | REST API + WebSocket server |
| SQLAlchemy + SQLite | Persistence layer |
| Pydantic v2 | Data validation & schemas |
| uvicorn | ASGI server |
| Custom A* | Path planning engine |

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 + TypeScript | UI framework |
| Vite | Build tool |
| Tailwind CSS | Styling |
| Zustand | State management |
| Recharts | Analytics charts |
| Canvas API | High-performance map rendering |

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm 9+

### Installation

```bash
# Clone / navigate to project
cd resq-ai

# Backend setup
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install
```

### Preview / CORS setup

For Vite preview mode, allow the frontend origin used by the preview server. The backend reads a comma-separated `CORS_ORIGINS` list from `.env` and defaults to:

```env
CORS_ORIGINS=http://localhost:5173,http://localhost:4173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:4173
```

This is required when you run:

```bash
cd frontend
npm run build
npm run preview -- --host 0.0.0.0
```

Preview is typically served on `http://localhost:4173` and must be included in the backend CORS allowlist to load scenario data and WebSocket events correctly.

---

## Running the Backend

```bash
cd backend

# Activate virtual environment
venv\Scripts\activate        # Windows
source venv/bin/activate     # Linux/Mac

# Start the server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Backend runs at: **http://127.0.0.1:8000**  
API docs at: **http://localhost:8000/docs**  
Health check: **http://127.0.0.1:8000/api/health**

---

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

The Vite development server proxies `/api` and `/ws` to the backend at
`http://localhost:8000`. To use another backend directly, set
`VITE_API_BASE_URL` before starting Vite. The React dashboard uses the
backend REST endpoints for scenarios, state, events, decisions, metrics, and
simulation controls, and connects to `/ws/simulations/{simulation_id}` for
live events.

---

## Running Tests

```bash
cd backend

# Activate virtual environment first
venv\Scripts\activate

# Run all tests
python -m pytest -q

# Run specific test files
pytest tests/test_triage.py -v
pytest tests/test_astar.py -v
pytest tests/test_simulation.py -v
pytest tests/test_battery.py -v

# Run with coverage
pytest tests/ --cov=app --cov-report=term-missing
```

## Competition Demo

The deterministic Competition Demo is documented in:

- [`docs/competition-scenario.md`](docs/competition-scenario.md)
- [`docs/demo-script.md`](docs/demo-script.md)
- [`docs/testing.md`](docs/testing.md)

It uses the real triage, A*, fire-spread, replanning, rescue, WebSocket, and
metrics paths. Start both services, select **Competition Demo**, and press
**START** in the dashboard.

---

## Scenario Configuration

ResQ-AI includes **11 scenario entries total**: 10 built-in scenarios plus the **Competition Demo**.

| ID | Name | Difficulty | Description |
|----|------|-----------|-------------|
| `scenario_01` | Basic Building Rescue | Easy | 2 victims, no active fire |
| `scenario_02` | Fire Emergency | Medium | Active fire, path around it |
| `scenario_03` | Multiple Victims | Medium | 5 victims, triage test |
| `scenario_04` | Blocked Route | Hard | Replanning required |
| `scenario_05` | Dynamic Fire Spread | Hard | Fire invalidates routes |
| `scenario_06` | Low Battery | Hard | Limited battery, must prioritize |
| `scenario_07` | High-Risk Critical Victim | Hard | Risk vs urgency tradeoff |
| `scenario_08` | Multiple Victims + Hazards | Expert | 6 victims, 3 fire zones |
| `scenario_09` | Changing Conditions | Expert | Fast fire spread, adaptability test |
| `scenario_10` | No Safe Route | Expert | Graceful failure handling |
| `demo` | Competition Demo | Medium | ⭐ Curated live demo scenario |

### Phase 6 bug fixes and cleanup

The project has been hardened for the Phase 6 regression pass:

- `A1`: moving-robot invalidation now flows through the shared decision engine, so `PATH_INVALIDATED` creates a real replan decision entry and explanation instead of a dead inline branch.
- `A2`: unreachable victims are excluded from triage and from move selection when no valid path exists, preventing instant “rescues” on empty routes.
- `A3`: the A* planner no longer contains the misleading dead `pass` block; impassable start cells are handled explicitly as a valid search start, not a false “no-op”.
- `A4`: rescue timing now measures from the victim’s `incident_start_tick`, so average rescue time reflects actual elapsed time instead of a near-zero tick offset.
- `A5`: unused ML dependencies were removed from the backend requirements file.
- `A6`: CORS now supports a comma-separated `CORS_ORIGINS` environment value, including the Vite preview port `4173`.
- `A7`: the no-op unsafe check has been removed.

### Scenario Weights Configuration

Edit `backend/.env` to adjust scoring weights:

```env
SEVERITY_WEIGHT=0.30
TIME_CRITICALITY_WEIGHT=0.25
DETERIORATION_WEIGHT=0.20
HAZARD_EXPOSURE_WEIGHT=0.15
ACCESSIBILITY_WEIGHT=0.10
```

---

## AI Decision Flow

```
Every Simulation Tick:

1. ENVIRONMENT UPDATE
   └── Fire spread, victim health decay, hazard changes

2. SAFETY CHECK
   └── Is robot in emergency hazard? → AVOID
   └── Must return to base for battery? → RETURN

3. VICTIM ASSESSMENT
   └── For each active victim:
       ├── Calculate A* path
       ├── Compute priority score (5 factors)
       └── Generate reason codes

4. PATH VALIDATION (if moving)
   └── Has fire spread to current path?
       ├── YES → REPLAN_TRIGGERED
       └── NO  → CONTINUE

5. DECISION
   └── Select highest-priority reachable victim
   └── Validate battery feasibility
   └── Generate explanation from reason codes

6. ACTION EXECUTION
   └── Move one step along A* path
   └── Rescue (multi-tick action)
   └── Update battery

7. EVENT BROADCAST
   └── WebSocket → Frontend → UI update
```

### Priority Score Formula

```
Priority Score =
  Severity         × 0.30  (CRITICAL=1.0, HIGH=0.75, MEDIUM=0.50, LOW=0.25)
+ Time Criticality × 0.25  (urgency + time since incident)
+ Deterioration    × 0.20  (health decline rate + current health)
+ Hazard Exposure  × 0.15  (proximity to fire/smoke)
+ Accessibility    × 0.10  (path outcome quality)
- Path Risk        × 0.10  (route risk score penalty)
```

All scores are normalized to **0–100**.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (React)                   │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────┐   │
│  │ Mission  │  │Scenarios │  │Decision History │   │
│  │Dashboard │  │Selection │  │  & Analytics    │   │
│  └──────────┘  └──────────┘  └─────────────────┘   │
│         │              │              │              │
│         └──────────────┴──────────────┘              │
│                         │                            │
│               WebSocket + REST API                   │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│                  BACKEND (FastAPI)                   │
│  ┌────────────────────────────────────────────────┐ │
│  │          Simulation Manager                    │ │
│  │  ┌──────────┐  ┌─────────┐  ┌──────────────┐ │ │
│  │  │Environment│  │Decision │  │Robot         │ │ │
│  │  │  (Grid)  │  │ Engine  │  │Controller    │ │ │
│  │  └──────────┘  └────┬────┘  └──────────────┘ │ │
│  │                     │                         │ │
│  │  ┌──────────┐  ┌────▼────┐  ┌──────────────┐ │ │
│  │  │  Triage  │  │  A*     │  │  Safety      │ │ │
│  │  │  Engine  │  │Planner  │  │  Engine      │ │ │
│  │  └──────────┘  └─────────┘  └──────────────┘ │ │
│  │                                               │ │
│  │  ┌──────────────┐  ┌────────────────────────┐ │ │
│  │  │Explainability│  │   Metrics Engine       │ │ │
│  │  └──────────────┘  └────────────────────────┘ │ │
│  └────────────────────────────────────────────────┘ │
│                         │                            │
│              SQLAlchemy + SQLite                     │
└─────────────────────────────────────────────────────┘
```

---

## Demo Procedure

### Competition Demo (Scenario: `demo`)

**Total demo time: ~3-5 minutes**

#### Setup (30 seconds)
1. Open browser at `http://localhost:5173`
2. Navigate to **Scenarios** → Select **"Competition Demo"**
3. Click **LAUNCH**

#### Demo Flow
```
T=0:   Robot at base (1,1)
       3 victims visible: VA (CRITICAL), VB (LOW), VC (HIGH)
       
T=1:   AI evaluates all victims
       → VA selected: "CRITICAL medical state, high urgency"
       Robot begins moving toward VA
       
T=3-5: Robot moving along planned path (shown with dashed line)

T=6:   🔥 FIRE SPREAD EVENT
       Fire expands to cells on current route
       
T=6:   ⚠️ PATH INVALIDATED
       "Original path blocked at (12,6)"
       REPLAN_TRIGGERED logged
       
T=7:   AI calculates alternative route
       "Alternative safe route selected: 14 steps, risk 0.12"
       
T=12:  Robot arrives at VA
       RESCUE_VICTIM action begins (5 ticks)
       
T=17:  ✅ VA RESCUED - Health at rescue: 38%
       AI re-evaluates remaining victims
       
T=18:  VC selected (HIGH severity > VB LOW)
       Battery check passes
       
T=25+: Robot navigates to VC
       VB rescued eventually
       Battery managed throughout
       
END:   Mission Results screen shown
       Score: 70-90/100 typically
```

#### Things to Highlight During Demo
- **AI Decision Panel** (right side) — shows real-time reasoning
- **Event Timeline** (bottom) — chronological log of every AI action
- **Priority Scores** — why VA was chosen over nearby VB
- **REPLAN badge** — appears when fire blocks path
- **Battery management** — robot considers return trip energy
- **Reason Codes** — `CRITICAL_MEDICAL_STATE`, `REPLAN_TRIGGERED`, etc.

#### Interactive Controls
During the demo, you can:
- Press **PAUSE** → explain the current AI state
- Press **STEP** → advance one tick at a time
- Use inject controls to trigger fire/block routes
- Navigate to **Decision History** to show reasoning timeline

---

## Limitations

1. **Single robot only** — multi-robot coordination not yet implemented
2. **Grid-based movement** — 4-directional (no diagonal) A* by default
3. **Deterministic simulation** — fire spread uses seeded RNG, not physics
4. **No ML layer yet** — optional ML triage predictor not implemented in v1
5. **SQLite only** — not suitable for production/concurrent deployments
6. **No real-world sensor data** — simulation environment only
7. **Victim health model** — simplified linear deterioration

---

## Future Scope

1. **Multi-robot coordination** — task allocation across robot fleet
2. **Machine learning triage** — scikit-learn urgency predictor trained on simulation data
3. **3D environment** — floor plans with multi-story navigation
4. **Real sensor integration** — camera feeds, thermal imaging simulation
5. **Earthquake/flood scenarios** — additional disaster types
6. **PostgreSQL migration** — production-ready database
7. **Docker deployment** — one-command startup
8. **Mobile control panel** — incident commander interface
9. **Replay system** — full mission replay from event log
10. **LLM narrative** — optional natural-language mission briefing

---

## API Reference

| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/health` | Health check |
| GET | `/api/scenarios` | List all scenarios |
| GET | `/api/scenarios/{id}` | Get scenario details |
| POST | `/api/simulations` | Create simulation |
| GET | `/api/simulations/{id}` | Get simulation info |
| POST | `/api/simulations/{id}/start` | Start simulation |
| POST | `/api/simulations/{id}/pause` | Pause simulation |
| POST | `/api/simulations/{id}/resume` | Resume simulation |
| POST | `/api/simulations/{id}/reset` | Reset simulation |
| POST | `/api/simulations/{id}/step` | Step one tick |
| GET | `/api/simulations/{id}/state` | Full state snapshot |
| GET | `/api/simulations/{id}/events` | Event log |
| GET | `/api/simulations/{id}/decisions` | Decision history |
| GET | `/api/simulations/{id}/metrics` | Performance metrics |
| POST | `/api/simulations/{id}/inject-event` | Inject dynamic events |
| WS | `/ws/simulations/{id}` | Real-time WebSocket |

Full interactive API docs: **http://localhost:8000/docs**

---

## License

Built for educational/competition purposes. ResQ-AI is a simulation — not for real-world deployment.
