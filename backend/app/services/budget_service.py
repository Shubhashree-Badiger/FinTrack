"""Business logic for monthly category budgets."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Budget
from app.schemas.budget import BudgetUpsert
from app.services import parse_month
from app.services.expense_service import get_category


def list_budgets(db: Session, user_id: int, month: str) -> list[Budget]:
    """Return all budgets set for the given 'YYYY-MM' month."""
    year, mon = parse_month(month)
    stmt = select(Budget).where(
        Budget.user_id == user_id, Budget.year == year, Budget.month == mon
    )
    return list(db.scalars(stmt.order_by(Budget.category_id)))


def get_budget(db: Session, category_id: int, year: int, month: int) -> Budget | None:
    """Return the budget for a category in a month, or None if none is set."""
    return db.scalar(
        select(Budget).where(
            Budget.category_id == category_id, Budget.year == year, Budget.month == month
        )
    )


def upsert_budget(db: Session, user_id: int, data: BudgetUpsert) -> Budget:
    """Create the budget for (category, month, year), or update its amount if it exists."""
    get_category(db, user_id, data.category_id)
    budget = get_budget(db, data.category_id, data.year, data.month)
    if budget is None:
        budget = Budget(user_id=user_id, **data.model_dump())
        db.add(budget)
    else:
        budget.amount = data.amount
    db.commit()
    db.refresh(budget)
    return budget
