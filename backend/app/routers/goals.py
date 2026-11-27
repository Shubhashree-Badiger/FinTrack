"""Savings goal endpoints."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.schemas.savings_goal import GoalContribute, GoalCreate, GoalOut
from app.services import goal_service

router = APIRouter(prefix="/goals", tags=["goals"])


@router.get("", response_model=list[GoalOut])
def list_goals(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """List savings goals with progress."""
    return goal_service.list_goals(db, user.id)


@router.post("", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
def create_goal(data: GoalCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Create a savings goal."""
    return goal_service.create_goal(db, user.id, data)


@router.patch("/{goal_id}/contribute", response_model=GoalOut)
def contribute(goal_id: int, data: GoalContribute, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Add an amount to a goal's saved amount."""
    return goal_service.contribute(db, user.id, goal_id, data)
