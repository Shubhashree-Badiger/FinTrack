"""Service layer: all business logic lives here. Also holds shared errors and month helpers."""
from datetime import date


class NotFoundError(Exception):
    """Raised when a requested record does not exist (mapped to HTTP 404)."""


class ConflictError(Exception):
    """Raised when an operation violates a uniqueness rule (mapped to HTTP 409)."""


class BadRequestError(Exception):
    """Raised when uploaded data cannot be used (mapped to HTTP 400)."""


def parse_month(month: str) -> tuple[int, int]:
    """Convert a validated 'YYYY-MM' string into a (year, month) tuple."""
    year, mon = month.split("-")
    return int(year), int(mon)


def month_bounds(year: int, month: int) -> tuple[date, date]:
    """Return the first day of the month and the first day of the next month."""
    start = date(year, month, 1)
    end = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
    return start, end
