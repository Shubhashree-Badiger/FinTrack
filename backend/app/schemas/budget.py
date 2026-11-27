"""Budget schemas and the shared month query type."""
from decimal import Decimal
from typing import Annotated

from fastapi import Query
from pydantic import BaseModel, ConfigDict, Field

# 'YYYY-MM' with month 01-12, validated at the API boundary.
MonthQuery = Annotated[str, Query(pattern=r"^\d{4}-(0[1-9]|1[0-2])$", examples=["2026-11"])]


class BudgetUpsert(BaseModel):
    """Payload for creating or replacing the budget of a category in a month."""

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
