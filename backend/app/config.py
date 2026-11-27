"""Application settings read from environment variables."""
import os
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+psycopg2://fintrack:fintrackpassword@localhost:5432/fintrack"
)
# Hosted providers (e.g. Render) give "postgres://" or "postgresql://"; SQLAlchemy needs the driver name.
for _prefix in ("postgres://", "postgresql://"):
    if DATABASE_URL.startswith(_prefix):
        DATABASE_URL = "postgresql+psycopg2://" + DATABASE_URL[len(_prefix):]
        break
# Set DB_SSL=true for databases reached over the public internet (Render's External URL).
DB_SSL = os.getenv("DB_SSL", "false").lower() == "true"
DEFAULT_USER_ID = 1  # single default user created by seed.py; there is no login
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")