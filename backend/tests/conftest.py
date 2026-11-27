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
from app.config import DEFAULT_USER_ID  # noqa: E402
from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Category, User  # noqa: E402


@pytest.fixture()
def client():
    """Test client backed by a fresh in-memory database with the default user and a Food category."""
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine, expire_on_commit=False)
    with Session() as db:
        db.add(User(id=DEFAULT_USER_ID, name="Test", email="test@example.com"))
        db.add(Category(id=1, user_id=DEFAULT_USER_ID, name="Food"))
        db.commit()

    def override_get_db():
        """Yield sessions bound to the in-memory database."""
        with Session() as db:
            yield db

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
