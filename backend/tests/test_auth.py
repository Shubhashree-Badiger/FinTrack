"""Tests for sign up, sign in, the demo account and per-user data isolation."""
from tests.conftest import register


def test_register_login_and_me(raw_client):
    """A new user can sign up, sign in again and read their own profile."""
    body = {"name": "Asha", "username": "Asha_1", "password": "secret123"}
    assert raw_client.post("/auth/register", json=body).status_code == 201
    login = raw_client.post("/auth/login", json={"username": "asha_1", "password": "secret123"})
    assert login.status_code == 200
    headers = {"Authorization": f"Bearer {login.json()['token']}"}
    me = raw_client.get("/auth/me", headers=headers).json()
    assert me["username"] == "asha_1" and me["is_demo"] is False


def test_new_user_gets_default_categories_and_no_data(client):
    """A fresh account has categories but no expenses, budgets or goals."""
    assert len(client.get("/categories").json()) >= 5
    assert client.get("/expenses?month=2026-11").json() == []
    assert client.get("/goals").json() == []


def test_duplicate_username_rejected(raw_client):
    """Usernames are unique, ignoring case."""
    register(raw_client, "sam")
    body = {"name": "Sam 2", "username": "SAM", "password": "secret123"}
    assert raw_client.post("/auth/register", json=body).status_code == 409


def test_wrong_password_rejected(raw_client):
    """A wrong password returns 401 with a clear message."""
    register(raw_client, "sam")
    bad = raw_client.post("/auth/login", json={"username": "sam", "password": "nope"})
    assert bad.status_code == 401
    assert bad.json()["detail"] == "Invalid username or password"


def test_short_password_rejected(raw_client):
    """Passwords shorter than 6 characters are rejected."""
    body = {"name": "A", "username": "abc", "password": "123"}
    assert raw_client.post("/auth/register", json=body).status_code == 422


def test_api_requires_login(raw_client):
    """Data endpoints return 401 without a valid token."""
    assert raw_client.get("/categories").status_code == 401
    assert raw_client.get("/expenses", headers={"Authorization": "Bearer junk"}).status_code == 401


def test_users_cannot_see_each_other(raw_client):
    """Expenses created by one user are invisible to another user."""
    first = register(raw_client, "first")
    raw_client.post("/expenses", headers=first,
                    json={"category_id": 1, "amount": "10", "spent_on": "2026-11-01"})
    second = register(raw_client, "second")
    assert raw_client.get("/expenses?month=2026-11", headers=second).json() == []
    assert len(raw_client.get("/expenses?month=2026-11", headers=first).json()) == 1


def test_demo_login_has_current_data(raw_client):
    """The demo button signs in as the demo user, who has data for the current month."""
    from datetime import date

    res = raw_client.post("/auth/demo")
    assert res.status_code == 200 and res.json()["user"]["is_demo"] is True
    headers = {"Authorization": f"Bearer {res.json()['token']}"}
    month = date.today().strftime("%Y-%m")
    assert len(raw_client.get(f"/expenses?month={month}", headers=headers).json()) > 0
    statuses = {a["status"] for a in raw_client.get(f"/alerts?month={month}", headers=headers).json()}
    assert {"low", "exceeded"} <= statuses
    # Calling it again must not duplicate data.
    again = raw_client.post("/auth/demo").json()["token"]
    count = len(raw_client.get(f"/expenses?month={month}",
                               headers={"Authorization": f"Bearer {again}"}).json())
    assert count == len(raw_client.get(f"/expenses?month={month}", headers=headers).json())


def test_demo_has_a_full_year_of_history(raw_client):
    """The demo account has spending in each of the last 12 months, reported by the trend endpoint."""
    from datetime import date

    token = raw_client.post("/auth/demo").json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    month = date.today().strftime("%Y-%m")
    trend = raw_client.get(f"/reports/monthly-trend?month={month}&months=12", headers=headers).json()
    assert len(trend) == 12 and trend[-1]["month"] == month
    assert all(float(point["total"]) > 0 for point in trend)
    assert [p["month"] for p in trend] == sorted(p["month"] for p in trend)
