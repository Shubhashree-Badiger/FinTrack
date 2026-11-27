"""Savings goal endpoints."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.savings_goal import GoalContribute, GoalCreate, GoalOut
from app.services import goal_service

router = APIRouter(prefix="/goals", tags=["goals"])


@router.get("", response_model=list[GoalOut])
def list_goals(db: Session = Depends(get_db)):
    """List savings goals with progress."""
    return goal_service.list_goals(db)


@router.post("", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
def create_goal(data: GoalCreate, db: Session = Depends(get_db)):
    """Create a savings goal."""
    return goal_service.create_goal(db, data)


@router.patch("/{goal_id}/contribute", response_model=GoalOut)
def contribute(goal_id: int, data: GoalContribute, db: Session = Depends(get_db)):
    """Add an amount to a goal's saved amount."""
    return goal_service.contribute(db, goal_id, data)
