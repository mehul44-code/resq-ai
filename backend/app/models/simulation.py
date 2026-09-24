from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Boolean, JSON
from sqlalchemy.sql import func
from app.core.database import Base

class ScenarioModel(Base):
    __tablename__ = "scenarios"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    difficulty = Column(String)
    grid_cols = Column(Integer, default=30)
    grid_rows = Column(Integer, default=20)
    seed = Column(Integer)

class SimulationRunModel(Base):
    __tablename__ = "simulation_runs"
    id = Column(String, primary_key=True)
    scenario_id = Column(String, nullable=False)
    status = Column(String, default="IDLE")
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    total_ticks = Column(Integer, default=0)
    mission_score = Column(Float)
    created_at = Column(DateTime, server_default=func.now())

class DecisionModel(Base):
    __tablename__ = "decisions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    simulation_id = Column(String, nullable=False)
    tick = Column(Integer)
    action = Column(String)
    target = Column(String)
    score = Column(Float)
    reason_codes = Column(JSON)
    explanation = Column(Text)
    battery_before = Column(Float)
    battery_after = Column(Float)
    created_at = Column(DateTime, server_default=func.now())

class EventModel(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    simulation_id = Column(String, nullable=False)
    event_type = Column(String)
    tick = Column(Integer)
    timestamp = Column(String)
    data = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())
