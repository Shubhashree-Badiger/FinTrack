"""Tiny schema upgrade for databases created before login existed (no Alembic needed)."""
from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

from app.database import Base


def upgrade_schema(engine: Engine) -> None:
    """Create missing tables and add the login columns to an older `users` table."""
    Base.metadata.create_all(bind=engine)
    columns = {c["name"] for c in inspect(engine).get_columns("users")}
    with engine.begin() as conn:
        if "username" not in columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN username VARCHAR(50)"))
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username ON users (username)"))
        if "password_hash" not in columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)"))
