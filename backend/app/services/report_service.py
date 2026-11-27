"""Business logic for monthly reports."""
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import DEFAULT_USER_ID
from app.models import Budget, Category
from app.schemas.report import BudgetVsSpendOut, MonthlyTotalOut
from app.services import parse_month
from app.services.alert_service import compute_status, spent_by_category


def monthly_total(db: Session, month: str) -> MonthlyTotalOut:
    """Return the total spending across all categories for a 'YYYY-MM' month."""
    year, mon = parse_month(month)
    total = sum(spent_by_category(db, year, mon).values(), Decimal("0"))
    return MonthlyTotalOut(month=month, total=total)


def budget_vs_spend(db: Session, month: str) -> list[BudgetVsSpendOut]:
    """Return budget, spent, remaining and status for every category in the month."""
    year, mon = parse_month(month)
    spent = spent_by_category(db, year, mon)
    stmt = (
        select(Category, Budget.amount)
        .outerjoin(
            Budget,
            (Budget.category_id == Category.id) & (Budget.year == year) & (Budget.month == mon),
        )
        .where(Category.user_id == DEFAULT_USER_ID)
        .order_by(Category.name)
    )
    rows = []
    for category, budget in db.execute(stmt):
        category_spent = spent.get(category.id, Decimal("0"))
        status, _ = compute_status(budget, category_spent)
        rows.append(
            BudgetVsSpendOut(
                category_id=category.id,
                category_name=category.name,
                budget=budget,
                spent=category_spent,
                remaining=None if budget is None else budget - category_spent,
                status=status,
            )
        )
    return rows
