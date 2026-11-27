"""Report endpoints."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.schemas.budget import MonthQuery
from app.schemas.report import BudgetVsSpendOut, MonthlyTotalOut, MonthTotalPoint
from app.services import report_service

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/monthly-total", response_model=MonthlyTotalOut)
def monthly_total(month: MonthQuery, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Total spend for the month."""
    return report_service.monthly_total(db, user.id, month)


@router.get("/budget-vs-spend", response_model=list[BudgetVsSpendOut])
def budget_vs_spend(month: MonthQuery, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Budget, spent, remaining and status per category."""
    return report_service.budget_vs_spend(db, user.id, month)


@router.get("/monthly-trend", response_model=list[MonthTotalPoint])
def monthly_trend(
    month: MonthQuery,
    months: int = Query(12, ge=1, le=36),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Total spend for each of the last N months, ending at the given month (oldest first)."""
    return report_service.monthly_trend(db, user.id, month, months)
