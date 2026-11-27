"""Application settings read from environment variables."""
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL", "mysql+pymysql://fintrack:fintrackpassword@localhost:3306/fintrack"
)
# Hosted providers often give a plain "mysql://" URL; SQLAlchemy needs the PyMySQL driver name.
if DATABASE_URL.startswith("mysql://"):
    DATABASE_URL = DATABASE_URL.replace("mysql://", "mysql+pymysql://", 1)

# Set DB_SSL=true for managed databases that require a TLS connection.
DB_SSL = os.getenv("DB_SSL", "false").lower() == "true"

DEFAULT_USER_ID = 1  # single default user created by seed.py; there is no login
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
