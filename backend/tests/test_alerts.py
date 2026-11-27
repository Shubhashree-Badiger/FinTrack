"""Tests for the budget alert status rules (ok, low, exceeded)."""

MONTH = "2026-11"


def food_status(client, spent: str) -> str:
    """Set a 100.00 Food budget, log one expense of `spent`, and return the alert status."""
    client.put("/budgets", json={"category_id": 1, "month": 11, "year": 2026, "amount": "100"})
    client.post("/expenses", json={"category_id": 1, "amount": spent, "spent_on": "2026-11-05"})
    alerts = client.get(f"/alerts?month={MONTH}").json()
    return alerts[0]["status"]


def test_status_ok(client):
    """More than 10% of the budget remaining is 'ok'."""
    assert food_status(client, "50") == "ok"


def test_status_low_at_ten_percent_remaining(client):
    """Exactly 10% remaining is 'low'."""
    assert food_status(client, "90") == "low"


def test_status_exceeded(client):
    """Spending above the budget is 'exceeded'."""
    assert food_status(client, "100.01") == "exceeded"
