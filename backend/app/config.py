"""Application settings read from environment variables."""
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL", "mysql+pymysql://fintrack:fintrackpassword@localhost:3306/fintrack"
)
DEFAULT_USER_ID = 1  # single default user created by seed.py; there is no login
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
