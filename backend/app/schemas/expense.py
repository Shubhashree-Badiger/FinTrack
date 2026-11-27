"""Expense schemas."""
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ExpenseCreate(BaseModel):
    """Payload for creating or replacing an expense."""

    category_id: int
    amount: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    description: str = Field(default="", max_length=255)
    spent_on: date


class ExpenseUpdate(ExpenseCreate):
    """Payload for updating an expense (full replacement, same fields as create)."""


class ExpenseOut(BaseModel):
    """Expense returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    category_id: int
    amount: Decimal
    description: str
    spent_on: date
    created_at: datetime
