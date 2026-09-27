import asyncio
from app.services.simulation.simulation_manager import SimulationManager
from app.services.simulation.types import RobotStatus

async def main():
    manager = SimulationManager()
    sim_id = manager.create_simulation('demo')
    session = manager.get_simulation(sim_id)
    session.initialize()
    for i in range(180):
        await session.step_once()
        if session.env.robot.status == RobotStatus.COMPLETED:
            break
    result = {
        'status': session.env.robot.status.value,
        'replans': session.env.robot.replans_count,
        'rescued': session.env.robot.victims_rescued,
        'remaining_unrescued': sum(1 for v in session.env.victims.values() if not v.rescued),
        'events': [e.event_type.value for e in session.all_events],
    }
    with open('debug_demo_output.txt', 'w', encoding='utf-8') as f:
        f.write(str(result))

asyncio.run(main())
