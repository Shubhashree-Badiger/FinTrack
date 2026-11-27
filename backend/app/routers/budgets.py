"""Budget endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.budget import BudgetOut, BudgetUpsert, MonthQuery
from app.services import budget_service

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("", response_model=list[BudgetOut])
def list_budgets(month: MonthQuery, db: Session = Depends(get_db)):
    """List budgets for a month."""
    return budget_service.list_budgets(db, month)


@router.put("", response_model=BudgetOut)
def upsert_budget(data: BudgetUpsert, db: Session = Depends(get_db)):
    """Create or update a category budget for a month and year."""
    return budget_service.upsert_budget(db, data)
