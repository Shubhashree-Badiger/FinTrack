"""Business logic for monthly reports."""
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Budget, Category, Expense
from app.schemas.report import BudgetVsSpendOut, MonthlyTotalOut, MonthTotalPoint
from app.services import month_bounds, parse_month
from app.services.alert_service import compute_status, spent_by_category


def monthly_total(db: Session, user_id: int, month: str) -> MonthlyTotalOut:
    """Return the total spending across all categories for a 'YYYY-MM' month."""
    year, mon = parse_month(month)
    total = sum(spent_by_category(db, user_id, year, mon).values(), Decimal("0"))
    return MonthlyTotalOut(month=month, total=total)


def budget_vs_spend(db: Session, user_id: int, month: str) -> list[BudgetVsSpendOut]:
    """Return budget, spent, remaining and status for every category in the month."""
    year, mon = parse_month(month)
    spent = spent_by_category(db, user_id, year, mon)
    stmt = (
        select(Category, Budget.amount)
        .outerjoin(
            Budget,
            (Budget.category_id == Category.id) & (Budget.year == year) & (Budget.month == mon),
        )
        .where(Category.user_id == user_id)
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


def monthly_trend(db: Session, user_id: int, month: str, months: int) -> list[MonthTotalPoint]:
    """Return the total spend of each of the last N months ending at `month`, oldest first.


    Months without expenses are included with a total of 0 so charts have no gaps.
    """
    end_year, end_mon = parse_month(month)
    index = end_year * 12 + (end_mon - 1)
    keys = [((index - i) // 12, (index - i) % 12 + 1) for i in range(months - 1, -1, -1)]
    start = month_bounds(*keys[0])[0]
    end = month_bounds(*keys[-1])[1]
    stmt = (
        select(Expense.spent_on, func.sum(Expense.amount))
        .where(Expense.user_id == user_id, Expense.spent_on >= start, Expense.spent_on < end)
        .group_by(Expense.spent_on)
    )
    totals = {key: Decimal("0") for key in keys}
    for day, amount in db.execute(stmt):
        totals[(day.year, day.month)] += Decimal(amount)
    return [MonthTotalPoint(month=f"{y:04d}-{m:02d}", total=totals[(y, m)]) for y, m in keys]
