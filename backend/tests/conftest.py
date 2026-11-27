"""Pytest fixtures: an in-memory SQLite database wired into the FastAPI app."""
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import models  # noqa: E402,F401
from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402


def register(client: TestClient, username: str = "tester", password: str = "secret123") -> dict:
    """Create an account and return its auth header."""
    body = {"name": "Test User", "username": username, "password": password}
    token = client.post("/auth/register", json=body).json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def raw_client():
    """Unauthenticated test client backed by a fresh in-memory database."""
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine, expire_on_commit=False)

    def override_get_db():
        """Yield sessions bound to the in-memory database."""
        with Session() as db:
            yield db

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture()
def client(raw_client):
    """Test client already signed in as a new user. Category 1 is 'Food' (a default category)."""
    raw_client.headers.update(register(raw_client))
    return raw_client
