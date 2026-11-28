"""FastAPI application entry point."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (registers tables on Base.metadata)
from app.config import FRONTEND_ORIGIN
from app.database import Base, engine
from app.routers import auth, budgets, categories, expenses, reports


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Create the database tables on startup."""
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="FinTrack API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (auth, categories, expenses, budgets, reports):
    app.include_router(router.router)


@app.get("/health")
def health() -> dict:
    """Liveness check."""
    return {"status": "ok"}
