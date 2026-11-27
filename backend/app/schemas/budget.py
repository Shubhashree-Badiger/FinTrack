"""Budget schemas and the shared month query type."""
from typing import Annotated

from fastapi import Query

# 'YYYY-MM' with month 01-12, validated at the API boundary.
MonthQuery = Annotated[str, Query(pattern=r"^\d{4}-(0[1-9]|1[0-2])$", examples=["2026-11"])]
