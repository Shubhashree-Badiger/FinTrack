"""Pydantic request and response schemas."""
from datetime import date
from decimal import Decimal
from typing import Annotated, Literal

from fastapi import Query
from pydantic import BaseModel, ConfigDict, Field

# Month in 'YYYY-MM' format, validated at the API boundary.
MonthQuery = Annotated[str, Query(pattern=r"^\d{4}-(0[1-9]|1[0-2])$", examples=["2026-11"])]

EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class RegisterIn(BaseModel):
    """Payload for creating an account."""

    name: str = Field(min_length=1, max_length=100)
    email: str = Field(pattern=EMAIL_PATTERN, max_length=255)
    password: str = Field(min_length=6, max_length=72)


class LoginIn(BaseModel):
    """Payload for logging in."""

    email: str
    password: str


class TokenOut(BaseModel):
    """Login response with the bearer token and the user's name."""

    access_token: str
    token_type: str = "bearer"
    name: str


class CategoryIn(BaseModel):
    """Payload for creating a category."""

    name: str = Field(min_length=1, max_length=100)


class CategoryOut(BaseModel):
    """Category returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class ExpenseIn(BaseModel):
    """Payload for creating or updating an expense."""

    category_id: int
    amount: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    description: str = Field(default="", max_length=255)
    spent_on: date


class ExpenseOut(BaseModel):
    """Expense returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    category_id: int
    amount: Decimal
    description: str
    spent_on: date


class BudgetIn(BaseModel):
    """Payload for setting a category budget for a month."""

    category_id: int
    month: int = Field(ge=1, le=12)
    year: int = Field(ge=2000, le=2100)
    amount: Decimal = Field(gt=0, max_digits=10, decimal_places=2)


class BudgetOut(BaseModel):
    """Budget returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    category_id: int
    month: int
    year: int
    amount: Decimal


class CategorySummary(BaseModel):
    """Budget, spending and status of one category in a month."""

    category_id: int
    category_name: str
    budget: Decimal | None
    spent: Decimal
    remaining: Decimal | None
    status: Literal["ok", "exceeded", "no_budget"]


class MonthSummary(BaseModel):
    """Total spending for a month plus the per-category comparison."""

    month: str
    total_spent: Decimal
    categories: list[CategorySummary]


class ExpenseSaved(ExpenseOut):
    """Saved expense plus the budget status of its category and month."""

    alert: CategorySummary
