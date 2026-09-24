# Testing

## Backend regression suite

From `backend`:

```powershell
python -m pytest -q
```

The suite covers the enum regression, A* planning, triage, battery behavior,
simulation lifecycle, fire spread, metrics, and the deterministic competition
sequence. The competition test checks the event order through fire spread,
path invalidation, replanning, rescue completion, and mission completion.

## Frontend validation

From `frontend`:

```powershell
npm run build
```

For a browser smoke test, run both services, open `http://localhost:5173`, select
Competition Demo, start the mission, and verify the map, event timeline, AI
decision panel, WebSocket updates, and final metrics.
