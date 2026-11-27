"""FastAPI application entry point."""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app import models  # noqa: F401  (registers tables on Base.metadata)
from app.config import FRONTEND_ORIGIN
from app.database import engine
from app.keep_alive import start_keep_alive
from app.migrations import upgrade_schema
from app.routers import alerts, auth, budgets, categories, expenses, goals, importer, reports
from app.services import BadRequestError, ConflictError, NotFoundError
from app.services.auth_service import AuthError


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Create or upgrade the database tables on startup and start the Render keep-alive ping."""
    upgrade_schema(engine)
    pinger = start_keep_alive()
    yield
    if pinger:
        pinger.cancel()


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


@app.exception_handler(BadRequestError)
async def bad_request_handler(_: Request, exc: BadRequestError) -> JSONResponse:
    """Translate BadRequestError into HTTP 400."""
    return JSONResponse(status_code=400, content={"detail": str(exc)})


@app.exception_handler(AuthError)
async def auth_handler(_: Request, exc: AuthError) -> JSONResponse:
    """Translate AuthError into HTTP 401."""
    return JSONResponse(status_code=401, content={"detail": str(exc)})


app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(expenses.router)
app.include_router(budgets.router)
app.include_router(alerts.router)
app.include_router(reports.router)
app.include_router(goals.router)
app.include_router(importer.router)


@app.get("/health")
def health() -> dict:
    """Return a simple liveness response."""
    return {"status": "ok"}

# In the combined Docker image the built React UI is in STATIC_DIR and is served at "/".
# Mounted last so every API route above takes priority. Absent in tests and API-only runs.
STATIC_DIR = os.getenv("STATIC_DIR", "static")
if os.path.isdir(STATIC_DIR):
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="ui")
