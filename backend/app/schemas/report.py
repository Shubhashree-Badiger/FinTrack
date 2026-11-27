"""Schemas for alerts and reports."""
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel

AlertStatus = Literal["ok", "low", "exceeded", "no_budget"]


class AlertOut(BaseModel):
    """Budget status of one category in one month."""

    category_id: int
    category_name: str
    month: str  # 'YYYY-MM'
    budget: Decimal | None
    spent: Decimal
    remaining: Decimal | None
    remaining_pct: float | None
    status: AlertStatus


class MonthlyTotalOut(BaseModel):
    """Total spending for a month."""

    month: str
    total: Decimal


class BudgetVsSpendOut(BaseModel):
    """Budget, spending and status for one category in a month."""

    category_id: int
    category_name: str
    budget: Decimal | None
    spent: Decimal
    remaining: Decimal | None
    status: AlertStatus


class MonthTotalPoint(BaseModel):
    """Total spending of one month, used for the yearly trend."""

    month: str  # 'YYYY-MM'
    total: Decimal
