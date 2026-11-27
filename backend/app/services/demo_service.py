"""Demo account: a shared user whose data is always kept current (idempotent)."""
from datetime import date
from decimal import Decimal

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.config import DEMO_PASSWORD, DEMO_USERNAME
from app.models import Budget, Category, Expense, SavingsGoal, User
from app.security import hash_password

DEMO_NAME = "Demo User"
DEMO_EMAIL = "demo@fintrack.local"

CATEGORIES = ["Food", "Transport", "Entertainment", "Bills", "Shopping", "Health", "Other"]
# Budgets per category in rupees. Food ends up "low" and Entertainment "exceeded" to show alerts.
BUDGETS = {"Food": 6000, "Transport": 2500, "Entertainment": 2000, "Bills": 4500,
           "Shopping": 3500, "Health": 1500, "Other": 1000}
# (category, amount, day of month, description) for the current month.
THIS_MONTH = [
    ("Food", 1850, 1, "Groceries"), ("Food", 640, 3, "Dinner out"),
    ("Food", 920, 8, "Weekend brunch"), ("Food", 2100, 12, "Monthly groceries"),
    ("Transport", 1200, 2, "Metro card recharge"), ("Transport", 480, 6, "Cab rides"),
    ("Entertainment", 1500, 4, "Concert tickets"), ("Entertainment", 649, 9, "OTT subscriptions"),
    ("Bills", 2800, 1, "Electricity bill"), ("Bills", 1100, 5, "Internet and mobile"),
    ("Shopping", 2400, 7, "New sneakers"), ("Health", 850, 10, "Pharmacy"),
]
# Smaller set for the previous month so reports and the month picker have history.
LAST_MONTH = [
    ("Food", 4800, 4, "Groceries and dining"), ("Transport", 1900, 6, "Fuel and metro"),
    ("Entertainment", 1200, 15, "Movies"), ("Bills", 4100, 2, "Rent share and utilities"),
    ("Shopping", 3000, 18, "Clothes"), ("Health", 600, 20, "Check-up"),
]
# (name, target, saved, months until deadline)
GOALS = [("Emergency Fund", 100000, 42000, 8), ("Goa Trip", 35000, 21500, 4),
         ("New Laptop", 80000, 8000, 10)]


def _shift(day: date, months: int) -> date:
    """Return the first day of the month `months` away from `day`'s month (may be negative)."""
    index = day.year * 12 + (day.month - 1) + months
    return date(index // 12, index % 12 + 1, 1)


def _wipe(db: Session, user_id: int) -> None:
    """Remove all data of a user (used once, to clear data from the pre-login version)."""
    for model in (Expense, Budget, SavingsGoal, Category):
        db.execute(delete(model).where(model.user_id == user_id))


def _find_or_create_user(db: Session) -> User:
    """Return the demo user, adopting the legacy default user (id 1, no username) if present."""
    user = db.scalar(select(User).where(User.username == DEMO_USERNAME))
    if user is None:
        legacy = db.get(User, 1)
        user = legacy if legacy is not None and legacy.username is None else User(name=DEMO_NAME)
        if legacy is user:
            _wipe(db, user.id)
        user.name, user.email, user.username = DEMO_NAME, DEMO_EMAIL, DEMO_USERNAME
        db.add(user)
    if not user.password_hash:
        user.password_hash = hash_password(DEMO_PASSWORD)
    db.flush()
    return user


def _add_month(db: Session, user_id: int, cats: dict[str, Category], first: date,
               rows: list, clip_day: int | None) -> None:
    """Insert budgets and expenses for one month if that month has no expenses yet."""
    has_expenses = db.scalar(
        select(Expense.id).where(
            Expense.user_id == user_id, Expense.spent_on >= first, Expense.spent_on < _shift(first, 1)
        ).limit(1)
    )
    if has_expenses:
        return
    for name, amount in BUDGETS.items():
        exists = db.scalar(select(Budget.id).where(
            Budget.category_id == cats[name].id, Budget.year == first.year, Budget.month == first.month))
        if not exists:
            db.add(Budget(user_id=user_id, category_id=cats[name].id, year=first.year,
                          month=first.month, amount=Decimal(amount)))
    for name, amount, day, description in rows:
        day = min(day, clip_day) if clip_day else day
        db.add(Expense(user_id=user_id, category_id=cats[name].id, amount=Decimal(amount),
                       description=description, spent_on=first.replace(day=day)))


def ensure_demo(db: Session) -> User:
    """Create or refresh the demo account so it always has data for the current month."""
    user = _find_or_create_user(db)
    existing = {c.name: c for c in db.scalars(select(Category).where(Category.user_id == user.id))}
    for name in CATEGORIES:
        if name not in existing:
            existing[name] = Category(user_id=user.id, name=name)
            db.add(existing[name])
    db.flush()
    today = date.today()
    this_first = today.replace(day=1)
    _add_month(db, user.id, existing, this_first, THIS_MONTH, today.day)
    _add_month(db, user.id, existing, _shift(this_first, -1), LAST_MONTH, None)
    if not db.scalar(select(SavingsGoal.id).where(SavingsGoal.user_id == user.id).limit(1)):
        for name, target, saved, months in GOALS:
            db.add(SavingsGoal(user_id=user.id, name=name, target_amount=Decimal(target),
                               saved_amount=Decimal(saved), deadline=_shift(this_first, months)))
    db.commit()
    db.refresh(user)
    return user
