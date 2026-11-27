"""Seed the database with a default user, categories and sample data (idempotent)."""
from datetime import date
from decimal import Decimal

from sqlalchemy import select

from app import models  # noqa: F401
from app.config import DEFAULT_USER_ID
from app.database import Base, SessionLocal, engine
from app.models import Budget, Category, Expense, User

CATEGORIES = ["Food", "Transport", "Entertainment", "Bills", "Shopping"]
BUDGETS = {"Food": 500, "Transport": 200, "Entertainment": 150, "Bills": 400, "Shopping": 300}
# (category, amount, day of month, description)
EXPENSES = [
    ("Food", 120.50, 1, "Groceries"),
    ("Food", 45.00, 3, "Dinner out"),
    ("Transport", 60.00, 2, "Metro pass"),
    ("Entertainment", 140.00, 4, "Concert tickets"),
    ("Bills", 150.00, 1, "Electricity"),
    ("Shopping", 80.00, 5, "T-shirts"),
]


def seed() -> None:
    """Create tables and insert demo data if the database is empty."""
    Base.metadata.create_all(bind=engine)
    today = date.today()
    with SessionLocal() as db:
        if db.get(User, DEFAULT_USER_ID):
            print("Database already seeded.")
            return
        db.add(User(id=DEFAULT_USER_ID, name="Shubhashree B Badiger", email="demo@fintrack.local"))
        db.flush()
        categories = {n: Category(user_id=DEFAULT_USER_ID, name=n) for n in CATEGORIES}
        db.add_all(categories.values())
        db.flush()
        for name, amount in BUDGETS.items():
            db.add(Budget(user_id=DEFAULT_USER_ID, category_id=categories[name].id,
                          month=today.month, year=today.year, amount=Decimal(amount)))
        for name, amount, day, description in EXPENSES:
            db.add(Expense(user_id=DEFAULT_USER_ID, category_id=categories[name].id,
                           amount=Decimal(str(amount)), description=description,
                           spent_on=date(today.year, today.month, day)))
        db.commit()
        print("Seeded demo data.")


if __name__ == "__main__":
    seed()
