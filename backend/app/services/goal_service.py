"""Business logic for savings goals."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import DEFAULT_USER_ID
from app.models import SavingsGoal
from app.schemas.savings_goal import GoalContribute, GoalCreate, GoalOut
from app.services import NotFoundError


def to_out(goal: SavingsGoal) -> GoalOut:
    """Convert a goal to its API form; progress_pct = saved / target * 100, capped at 100."""
    progress = min(float(goal.saved_amount / goal.target_amount * 100), 100.0)
    return GoalOut(
        id=goal.id,
        name=goal.name,
        target_amount=goal.target_amount,
        saved_amount=goal.saved_amount,
        deadline=goal.deadline,
        created_at=goal.created_at,
        progress_pct=round(progress, 2),
    )


def list_goals(db: Session) -> list[GoalOut]:
    """Return all savings goals, newest first."""
    stmt = select(SavingsGoal).where(SavingsGoal.user_id == DEFAULT_USER_ID)
    return [to_out(g) for g in db.scalars(stmt.order_by(SavingsGoal.id.desc()))]


def create_goal(db: Session, data: GoalCreate) -> GoalOut:
    """Create a savings goal with nothing saved yet."""
    goal = SavingsGoal(user_id=DEFAULT_USER_ID, **data.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return to_out(goal)


def contribute(db: Session, goal_id: int, data: GoalContribute) -> GoalOut:
    """Add an amount to the goal's saved_amount."""
    goal = db.get(SavingsGoal, goal_id)
    if goal is None or goal.user_id != DEFAULT_USER_ID:
        raise NotFoundError(f"Goal {goal_id} not found")
    goal.saved_amount = goal.saved_amount + data.amount
    db.commit()
    db.refresh(goal)
    return to_out(goal)
