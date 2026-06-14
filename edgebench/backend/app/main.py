import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routers import metrics, processes, benchmarks, docker_monitor, diagnostics, alerts, analytics, reports
from .services.metrics_collector import MetricsCollector

collector = MetricsCollector(interval=30)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    Base.metadata.create_all(bind=engine)
    # Inject collector into metrics router
    metrics.set_collector(collector)
    # Start background collection task
    task = asyncio.create_task(collector.start_collecting())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="EdgeBench API",
    description="Linux Performance & Benchmarking Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(metrics.router,         prefix="/api/v1/metrics",      tags=["Metrics"])
app.include_router(processes.router,       prefix="/api/v1/processes",    tags=["Processes"])
app.include_router(benchmarks.router,      prefix="/api/v1/benchmarks",   tags=["Benchmarks"])
app.include_router(docker_monitor.router,  prefix="/api/v1/docker",       tags=["Docker"])
app.include_router(diagnostics.router,     prefix="/api/v1/diagnostics",  tags=["Diagnostics"])
app.include_router(alerts.router,          prefix="/api/v1/alerts",       tags=["Alerts"])
app.include_router(analytics.router,       prefix="/api/v1/analytics",    tags=["Analytics"])
app.include_router(reports.router,         prefix="/api/v1/reports",      tags=["Reports"])


# ─── REST root ────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"name": "EdgeBench", "version": "1.0.0", "status": "running", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


# ─── WebSocket real-time feed ─────────────────────────────────────────────────

class ConnectionManager:
    def __init__(self):
        self.connections: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.connections.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.connections:
            self.connections.remove(ws)

    async def broadcast(self, data: dict):
        for ws in list(self.connections):
            try:
                await ws.send_json(data)
            except Exception:
                self.disconnect(ws)


manager = ConnectionManager()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = collector.get_current_metrics()
            await websocket.send_json(data)
            await asyncio.sleep(5)
    except (WebSocketDisconnect, Exception):
        manager.disconnect(websocket)
