"""FastAPI application entry point."""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app import models  # noqa: F401  (registers tables on Base.metadata)
from app.config import FRONTEND_ORIGIN
from app.database import Base, engine
from app.routers import alerts, budgets, categories, expenses, goals, reports
from app.services import ConflictError, NotFoundError


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Create database tables on startup."""
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="FinTrack API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(NotFoundError)
async def not_found_handler(_: Request, exc: NotFoundError) -> JSONResponse:
    """Translate NotFoundError into HTTP 404."""
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(ConflictError)
async def conflict_handler(_: Request, exc: ConflictError) -> JSONResponse:
    """Translate ConflictError into HTTP 409."""
    return JSONResponse(status_code=409, content={"detail": str(exc)})


app.include_router(categories.router)
app.include_router(expenses.router)
app.include_router(budgets.router)
app.include_router(alerts.router)
app.include_router(reports.router)
app.include_router(goals.router)


@app.get("/health")
def health() -> dict:
    """Return a simple liveness response."""
    return {"status": "ok"}

# In the combined Docker image the built React UI is in STATIC_DIR and is served at "/".
# Mounted last so every API route above takes priority. Absent in tests and API-only runs.
STATIC_DIR = os.getenv("STATIC_DIR", "static")
if os.path.isdir(STATIC_DIR):
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="ui")
