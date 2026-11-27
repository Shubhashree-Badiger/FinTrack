"""Tests for input validation, edge cases and reports."""
from decimal import Decimal

from app.services.alert_service import compute_status

MONTH = "2026-11"


def test_negative_and_zero_expense_rejected(client):
    """Expense amounts must be greater than zero."""
    for amount in ("-5", "0"):
        res = client.post("/expenses", json={"category_id": 1, "amount": amount,
                                             "spent_on": "2026-11-01"})
        assert res.status_code == 422


def test_zero_or_negative_budget_rejected(client):
    """Budget amounts must be greater than zero."""
    for amount in ("0", "-100"):
        res = client.put("/budgets", json={"category_id": 1, "month": 11, "year": 2026,
                                           "amount": amount})
        assert res.status_code == 422


def test_compute_status_handles_zero_budget():
    """A zero budget must not cause a division by zero."""
    assert compute_status(Decimal("0"), Decimal("0")) == ("ok", None)
    assert compute_status(Decimal("0"), Decimal("5")) == ("exceeded", None)
    assert compute_status(None, Decimal("5")) == ("no_budget", None)


def test_budget_vs_spend_shows_zero_for_unspent_categories(client):
    """A category with a budget but no expenses reports spent = 0."""
    client.put("/budgets", json={"category_id": 1, "month": 11, "year": 2026, "amount": "500"})
    rows = client.get(f"/reports/budget-vs-spend?month={MONTH}").json()
    food = next(r for r in rows if r["category_id"] == 1)
    assert Decimal(food["spent"]) == 0 and Decimal(food["remaining"]) == 500
    assert food["status"] == "ok"
    assert len(rows) >= 5  # every category is listed, even without budgets


def test_monthly_total_sums_all_categories(client):
    """The monthly total adds expenses of every category."""
    for category_id, amount in ((1, "100"), (2, "50.50")):
        client.post("/expenses", json={"category_id": category_id, "amount": amount,
                                       "spent_on": "2026-11-03"})
    assert Decimal(client.get(f"/reports/monthly-total?month={MONTH}").json()["total"]) == Decimal("150.50")


def test_alert_updates_after_edit_and_delete(client):
    """Editing or deleting an expense changes the alert on the next read."""
    client.put("/budgets", json={"category_id": 1, "month": 11, "year": 2026, "amount": "100"})
    saved = client.post("/expenses", json={"category_id": 1, "amount": "150",
                                           "spent_on": "2026-11-05"}).json()
    assert saved["alert"]["status"] == "exceeded"
    edited = client.put(f"/expenses/{saved['id']}", json={"category_id": 1, "amount": "40",
                                                          "spent_on": "2026-11-05"}).json()
    assert edited["alert"]["status"] == "ok"
    client.delete(f"/expenses/{saved['id']}")
    alert = client.get(f"/alerts?month={MONTH}").json()[0]
    assert Decimal(alert["spent"]) == 0 and alert["status"] == "ok"


def test_goal_contribution_caps_progress(client):
    """Goal progress never exceeds 100%."""
    goal = client.post("/goals", json={"name": "Trip", "target_amount": "1000"}).json()
    done = client.patch(f"/goals/{goal['id']}/contribute", json={"amount": "1500"}).json()
    assert done["progress_pct"] == 100.0


def test_monthly_trend_fills_empty_months(client):
    """The yearly trend lists every month, using 0 where nothing was spent."""
    client.post("/expenses", json={"category_id": 1, "amount": "100", "spent_on": "2026-11-03"})
    trend = client.get("/reports/monthly-trend?month=2026-11&months=3").json()
    assert [p["month"] for p in trend] == ["2026-09", "2026-10", "2026-11"]
    assert [float(p["total"]) for p in trend] == [0.0, 0.0, 100.0]
