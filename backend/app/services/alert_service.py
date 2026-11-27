"""Budget alert logic. Alerts are calculated on demand and never stored."""
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Budget, Category, Expense
from app.schemas.report import AlertOut
from app.services import month_bounds, parse_month

LOW_THRESHOLD_PCT = Decimal("10")


def compute_status(budget: Decimal | None, spent: Decimal) -> tuple[str, Decimal | None]:
    """Return (status, remaining_pct) for a budget and the amount spent against it.

    exceeded: spent > budget; low: 10% or less remaining; ok: otherwise;
    no_budget: no budget set.
    """
    if budget is None:
        return "no_budget", None
    if budget <= 0:  # guard against division by zero; a zero budget is exceeded by any spending
        return ("exceeded" if spent > 0 else "ok"), None
    remaining_pct = (budget - spent) / budget * 100
    if spent > budget:
        return "exceeded", remaining_pct
    if remaining_pct <= LOW_THRESHOLD_PCT:
        return "low", remaining_pct
    return "ok", remaining_pct


def spent_by_category(db: Session, user_id: int, year: int, month: int) -> dict[int, Decimal]:
    """Return total spending per category id for the given month."""
    start, end = month_bounds(year, month)
    stmt = (
        select(Expense.category_id, func.sum(Expense.amount))
        .where(Expense.user_id == user_id, Expense.spent_on >= start, Expense.spent_on < end)
        .group_by(Expense.category_id)
    )
    return {category_id: Decimal(total) for category_id, total in db.execute(stmt)}


def build_alert(
    category: Category, budget: Decimal | None, spent: Decimal, year: int, month: int
) -> AlertOut:
    """Assemble the alert for one category from its budget and spending."""
    status, remaining_pct = compute_status(budget, spent)
    return AlertOut(
        category_id=category.id,
        category_name=category.name,
        month=f"{year:04d}-{month:02d}",
        budget=budget,
        spent=spent,
        remaining=None if budget is None else budget - spent,
        remaining_pct=None if remaining_pct is None else round(float(remaining_pct), 2),
        status=status,
    )


def get_category_alert(db: Session, user_id: int, category: Category, year: int, month: int) -> AlertOut:
    """Return the current alert status of one category for a month."""
    budget = db.scalar(
        select(Budget.amount).where(
            Budget.category_id == category.id, Budget.year == year, Budget.month == month
        )
    )
    spent = spent_by_category(db, user_id, year, month).get(category.id, Decimal("0"))
    return build_alert(category, budget, spent, year, month)


def list_alerts(db: Session, user_id: int, month: str) -> list[AlertOut]:
    """Return the alert status of every category that has a budget in the month."""
    year, mon = parse_month(month)
    spent = spent_by_category(db, user_id, year, mon)
    stmt = (
        select(Category, Budget.amount)
        .join(Budget, Budget.category_id == Category.id)
        .where(Category.user_id == user_id, Budget.year == year, Budget.month == mon)
        .order_by(Category.name)
    )
    return [
        build_alert(category, amount, spent.get(category.id, Decimal("0")), year, mon)
        for category, amount in db.execute(stmt)
    ]
