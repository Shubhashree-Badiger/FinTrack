"""Report endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.budget import MonthQuery
from app.schemas.report import BudgetVsSpendOut, MonthlyTotalOut
from app.services import report_service

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/monthly-total", response_model=MonthlyTotalOut)
def monthly_total(month: MonthQuery, db: Session = Depends(get_db)):
    """Total spend for the month."""
    return report_service.monthly_total(db, month)


@router.get("/budget-vs-spend", response_model=list[BudgetVsSpendOut])
def budget_vs_spend(month: MonthQuery, db: Session = Depends(get_db)):
    """Budget, spent, remaining and status per category."""
    return report_service.budget_vs_spend(db, month)
