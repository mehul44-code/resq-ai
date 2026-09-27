import pytest
from app.services.simulation.environment import DisasterEnvironment
from app.services.simulation.types import Position, CellType, RobotState, RobotStatus
from app.services.planning.astar import AStarPlanner
from app.services.simulation.types import PathOutcome

@pytest.fixture
def small_env():
    e = DisasterEnvironment(cols=10, rows=10, seed=42)
    r = RobotState(
        id="R01", position=Position(0, 0), battery=100.0, max_battery=100.0,
        speed=1.0, status=RobotStatus.IDLE, base_position=Position(0, 0)
    )
    e.robot = r
    return e

def test_direct_path(small_env):
    planner = AStarPlanner(small_env)
    result = planner.find_path(Position(0, 0), Position(5, 5))
    assert len(result.path) > 0
    assert result.path[-1] == Position(5, 5)
    assert result.outcome in (PathOutcome.SAFE_PATH_FOUND, PathOutcome.SAFE_BUT_EXPENSIVE)

def test_path_around_wall(small_env):
    # Add a vertical wall at x=3
    for y in range(0, 9):
        small_env.set_cell_type(Position(3, y), CellType.WALL)
    # Open passage at bottom
    small_env.set_cell_type(Position(3, 9), CellType.EMPTY)
    
    planner = AStarPlanner(small_env)
    result = planner.find_path(Position(0, 5), Position(7, 5))
    # Should find path through the bottom passage
    assert len(result.path) > 0
    assert result.path[-1] == Position(7, 5)

def test_no_path_when_fully_blocked(small_env):
    # Block all cells at x=3 with walls
    for y in range(10):
        small_env.set_cell_type(Position(3, y), CellType.WALL)
    
    planner = AStarPlanner(small_env)
    result = planner.find_path(Position(0, 5), Position(7, 5))
    assert result.outcome == PathOutcome.TARGET_UNREACHABLE
    assert len(result.path) == 0

def test_path_avoids_fire(small_env):
    from app.services.simulation.types import HazardState, HazardType
    # Add fire across middle
    h = HazardState(
        id="H01", hazard_type=HazardType.FIRE,
        position=Position(3, 3), intensity=1.0,
        spread_rate=0.0, spread_interval=999,
        affected_cells=[Position(3, y) for y in range(4, 9)]
    )
    small_env.add_hazard(h)
    
    planner = AStarPlanner(small_env)
    result = planner.find_path(Position(0, 6), Position(8, 6))
    # Check path doesn't go through fire cells (y=4 to y=8 at x=3)
    fire_positions = {(3, y) for y in range(4, 9)}
    for pos in result.path:
        assert (pos.x, pos.y) not in fire_positions, f"Path went through fire at ({pos.x},{pos.y})"

def test_start_equals_goal(small_env):
    planner = AStarPlanner(small_env)
    result = planner.find_path(Position(5, 5), Position(5, 5))
    # Should return a trivial path or find path of length 1
    assert result.path is not None


def test_path_from_impassable_start_cell(small_env):
    small_env.set_cell_type(Position(0, 0), CellType.WALL)
    planner = AStarPlanner(small_env)
    result = planner.find_path(Position(0, 0), Position(4, 4))
    assert result.path
    assert result.path[-1] == Position(4, 4)
