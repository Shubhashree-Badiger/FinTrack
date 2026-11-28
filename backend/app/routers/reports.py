"""Report endpoint: monthly total and budget vs spend per category."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import services
from app.database import get_db
from app.models import User
from app.schemas import MonthQuery, MonthSummary
from app.security import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/summary", response_model=MonthSummary)
def summary(
    month: MonthQuery, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Total spending for the month and spending vs budget for each category."""
    return services.month_summary(db, user.id, month)
