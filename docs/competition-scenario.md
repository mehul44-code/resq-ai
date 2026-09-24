# Competition Demo Scenario

The `demo` scenario is a deterministic single-robot mission with three victims:

- `VA`: critical, high urgency
- `VB`: low severity, nearby
- `VC`: high severity, farther away

Its fixed seed places a dynamic fire beside the initial A* route. The fire
spreads once during the mission, invalidates the active route, and forces the
real decision engine to replan. The robot then continues through the normal
movement, rescue, battery, and mission-completion logic.

The scenario is intentionally deterministic so the same high-level sequence
can be demonstrated repeatedly:

`target selection -> path planned -> fire spread -> path invalidated ->
replanning -> rescue -> reassessment -> mission complete`

Run it from the dashboard by selecting **Competition Demo**, pressing
**START**, and watching the event timeline and AI Decision Panel.
