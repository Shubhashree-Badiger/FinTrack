"""Application settings read from environment variables."""
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL", "mysql+pymysql://fintrack:fintrackpassword@localhost:3306/fintrack"
)
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
