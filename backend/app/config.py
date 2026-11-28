"""Settings read from environment variables (or a local .env file)."""
import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/fintrack"
)
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
TOKEN_HOURS = 24
