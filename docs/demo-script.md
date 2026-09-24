# Competition Demo Script

1. Start the backend from `backend` with `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`.
2. Start the frontend from `frontend` with `npm install` and `npm run dev`.
3. Open `http://localhost:5173`.
4. Select **Competition Demo** and press **RUN COMPETITION DEMO**.
5. At about 0:20, point out the three detected victims and target candidate scores.
6. At about 0:40, point out the critical victim selected by the AI rather than simply the nearest victim.
7. Point out the A* route and robot movement on the map.
8. Around the first fire spread, point out **PATH INVALIDATED** and the preserved red previous route.
9. Point out **REPLANNING**, the new route, and the structured decision explanation.
10. Point out each rescue and the mission reassessment.
11. Open **RESULTS** after completion to show actual rescue, distance, battery, hazard,
    replanning, and mission score metrics.

The exact runtime depends on the browser and tick interval; use these timestamps
as presentation landmarks rather than strict deadlines.
