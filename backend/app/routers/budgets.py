"""Budget endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.schemas.budget import BudgetOut, BudgetUpsert, MonthQuery
from app.services import budget_service

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("", response_model=list[BudgetOut])
def list_budgets(month: MonthQuery, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """List budgets for a month."""
    return budget_service.list_budgets(db, user.id, month)


@router.put("", response_model=BudgetOut)
def upsert_budget(data: BudgetUpsert, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Create or update a category budget for a month and year."""
    return budget_service.upsert_budget(db, user.id, data)
