"""Alert endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.schemas.budget import MonthQuery
from app.schemas.report import AlertOut
from app.services import alert_service

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=list[AlertOut])
def list_alerts(month: MonthQuery, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Alert status for every category with a budget in the month."""
    return alert_service.list_alerts(db, user.id, month)
