"""Savings goal schemas."""
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class GoalCreate(BaseModel):
    """Payload for creating a savings goal."""

    name: str = Field(min_length=1, max_length=100)
    target_amount: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    deadline: date | None = None


class GoalContribute(BaseModel):
    """Payload for adding money to a goal."""

    amount: Decimal = Field(gt=0, max_digits=10, decimal_places=2)


class GoalOut(BaseModel):
    """Savings goal returned by the API, with progress capped at 100%."""

    id: int
    name: str
    target_amount: Decimal
    saved_amount: Decimal
    deadline: date | None
    created_at: datetime
    progress_pct: float
