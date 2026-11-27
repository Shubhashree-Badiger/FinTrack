"""Demo account: a shared user whose data is always kept current (idempotent)."""
import random
from datetime import date
from decimal import Decimal

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.config import DEMO_PASSWORD, DEMO_USERNAME
from app.models import Budget, Category, Expense, SavingsGoal, User
from app.security import hash_password

DEMO_NAME = "Demo User"
DEMO_EMAIL = "demo@fintrack.local"
HISTORY_MONTHS = 12  # current month plus the 11 before it

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
# How a typical month looks: (category, items per month, min amount, max amount, descriptions).
PATTERNS = [
    ("Food", (9, 13), 120, 1500, ["Groceries", "Dinner out", "Swiggy order", "Zomato order", "Weekend brunch", "Vegetables and fruits", "Bakery", "Office lunch"]),
    ("Transport", (6, 10), 60, 950, ["Metro card recharge", "Cab ride", "Fuel", "Auto rickshaw", "Bus pass", "Parking"]),
    ("Entertainment", (2, 4), 199, 1600, ["Movie night", "OTT subscription", "Concert tickets", "Gaming", "Weekend outing"]),
    ("Shopping", (1, 3), 500, 3800, ["Clothes", "Online shopping", "Gadget accessories", "Home items", "Shoes"]),
    ("Health", (1, 2), 250, 1400, ["Pharmacy", "Doctor consultation", "Gym membership", "Health check-up"]),
    ("Other", (1, 2), 150, 900, ["Gift", "Donation", "Stationery", "Miscellaneous"]),
]
FESTIVE_MONTHS = {10, 11, 12}  # more shopping and entertainment around the festive season


def _history_rows(first: date) -> list:
    """Generate a realistic, repeatable set of expenses for one past month.

    The random generator is seeded with the month, so the same month always gets the same data.
    """
    rng = random.Random(f"fintrack-{first.year}-{first.month}")
    rows = []
    for category, (low, high), min_amount, max_amount, descriptions in PATTERNS:
        count = rng.randint(low, high)
        if first.month in FESTIVE_MONTHS and category in ("Shopping", "Entertainment"):
            count += 1
        for _ in range(count):
            amount = round(rng.uniform(min_amount, max_amount) / 10) * 10
            rows.append((category, amount, rng.randint(1, 28), rng.choice(descriptions)))
    # Bills repeat every month with small changes.
    rows.append(("Bills", rng.randint(1800, 3300), rng.randint(1, 8), "Electricity bill"))
    rows.append(("Bills", 1099, rng.randint(3, 12), "Internet and mobile"))
    rows.append(("Bills", rng.randint(350, 750), rng.randint(5, 15), "Water and gas"))
    return rows

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
    for back in range(1, HISTORY_MONTHS):  # the previous 11 months, so the demo shows a full year
        month_first = _shift(this_first, -back)
        _add_month(db, user.id, existing, month_first, _history_rows(month_first), None)
    if not db.scalar(select(SavingsGoal.id).where(SavingsGoal.user_id == user.id).limit(1)):
        for name, target, saved, months in GOALS:
            db.add(SavingsGoal(user_id=user.id, name=name, target_amount=Decimal(target),
                               saved_amount=Decimal(saved), deadline=_shift(this_first, months)))
    db.commit()
    db.refresh(user)
    return user
