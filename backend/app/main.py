from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import init_db
from app.core.logging_config import logger
from app.api.simulation_routes import router
from app.websocket.ws_handler import websocket_endpoint

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("ResQ-AI Backend starting...")
    await init_db()
    logger.info("Database initialized")
    yield
    logger.info("ResQ-AI Backend shutting down")

app = FastAPI(
    title="ResQ-AI API",
    description="AI Rescue Robot — Disaster Management Agent Backend",
    version=settings.APP_VERSION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.websocket("/ws/simulations/{sim_id}")
async def websocket_route(websocket: WebSocket, sim_id: str):
    await websocket_endpoint(websocket, sim_id)

@app.get("/health")
async def root_health():
    return {"status": "ok", "service": settings.APP_NAME, "version": settings.APP_VERSION}
