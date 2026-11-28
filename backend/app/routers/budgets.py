"""Budget endpoints (one budget per category per month)."""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import services
from app.database import get_db
from app.models import Budget, User
from app.routers.expenses import get_own_category
from app.schemas import BudgetIn, BudgetOut, MonthQuery
from app.security import get_current_user

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("", response_model=list[BudgetOut])
def list_budgets(
    month: MonthQuery, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """List the user's budgets for a month."""
    year, mon = services.parse_month(month)
    stmt = select(Budget).where(
        Budget.user_id == user.id, Budget.year == year, Budget.month == mon
    )
    return db.scalars(stmt.order_by(Budget.category_id))


@router.put("", response_model=BudgetOut)
def set_budget(
    data: BudgetIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Create the budget for (category, month, year), or update it if it exists."""
    get_own_category(db, user, data.category_id)
    budget = db.scalar(
        select(Budget).where(
            Budget.category_id == data.category_id,
            Budget.year == data.year,
            Budget.month == data.month,
        )
    )
    if budget is None:
        budget = Budget(user_id=user.id, **data.model_dump())
        db.add(budget)
    else:
        budget.amount = data.amount
    db.commit()
    db.refresh(budget)
    return budget
