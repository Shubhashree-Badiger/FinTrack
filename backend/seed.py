"""Prepare the database and make sure the demo account has current data (idempotent)."""
from app import models  # noqa: F401
from app.database import SessionLocal, engine
from app.migrations import upgrade_schema
from app.services.demo_service import ensure_demo


def seed() -> None:
    """Create or upgrade tables, then create or refresh the demo user and its data."""
    upgrade_schema(engine)
    with SessionLocal() as db:
        ensure_demo(db)
    print("Database ready. Demo account refreshed.")


if __name__ == "__main__":
    seed()