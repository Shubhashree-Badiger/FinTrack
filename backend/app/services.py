"""Business logic: monthly spending, budget status and the budget-vs-spend report."""
from datetime import date
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Budget, Category, Expense
from app.schemas import CategorySummary, MonthSummary


def parse_month(month: str) -> tuple[int, int]:
    """Convert a validated 'YYYY-MM' string into (year, month)."""
    year, mon = month.split("-")
    return int(year), int(mon)


def month_bounds(year: int, month: int) -> tuple[date, date]:
    """Return the first day of the month and the first day of the next month."""
    start = date(year, month, 1)
    end = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
    return start, end


def spent_by_category(db: Session, user_id: int, year: int, month: int) -> dict[int, Decimal]:
    """Return the user's total spending per category id for one month."""
    start, end = month_bounds(year, month)
    stmt = (
        select(Expense.category_id, func.sum(Expense.amount))
        .where(Expense.user_id == user_id, Expense.spent_on >= start, Expense.spent_on < end)
        .group_by(Expense.category_id)
    )
    return {category_id: Decimal(total) for category_id, total in db.execute(stmt)}


def build_summary(category: Category, budget: Decimal | None, spent: Decimal) -> CategorySummary:
    """Compare spending with the budget.

    Status is 'exceeded' when spent > budget, 'ok' otherwise, and
    'no_budget' when no budget is set for that month.
    """
    if budget is None:
        status = "no_budget"
    elif spent > budget:
        status = "exceeded"
    else:
        status = "ok"
    return CategorySummary(
        category_id=category.id,
        category_name=category.name,
        budget=budget,
        spent=spent,
        remaining=None if budget is None else budget - spent,
        status=status,
    )


def category_alert(
    db: Session, user_id: int, category: Category, year: int, month: int
) -> CategorySummary:
    """Return the current budget status of one category for a month."""
    budget = db.scalar(
        select(Budget.amount).where(
            Budget.category_id == category.id, Budget.year == year, Budget.month == month
        )
    )
    spent = spent_by_category(db, user_id, year, month).get(category.id, Decimal("0"))
    return build_summary(category, budget, spent)


def month_summary(db: Session, user_id: int, month: str) -> MonthSummary:
    """Return the month's total spending and budget vs spend for every category."""
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
    rows = [
        build_summary(category, budget, spent.get(category.id, Decimal("0")))
        for category, budget in db.execute(stmt)
    ]
    return MonthSummary(
        month=month, total_spent=sum(spent.values(), Decimal("0")), categories=rows
    )
