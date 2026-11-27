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
# Secret used to sign login tokens. Set a long random value in production.
SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-secret-change-me")
TOKEN_TTL_HOURS = int(os.getenv("TOKEN_TTL_HOURS", "72"))
# Shared demo account used by the "Try the demo" button.
DEMO_USERNAME = "demo"
DEMO_PASSWORD = "demo1234"
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
