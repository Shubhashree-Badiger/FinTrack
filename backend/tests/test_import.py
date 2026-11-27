"""Tests for the CSV expense import."""
from app.services.import_service import TEMPLATE

CSV = (
    "date,amount,category,description\n"
    "2026-11-01,450,Food,Lunch\n"
    "02/11/2026,\"1,200.50\",Travel,Weekend trip\n"
    "2026-11-03,90,,Swiggy order\n"
    "not-a-date,10,Food,Bad row\n"
    "2026-11-04,,Food,No amount\n"
)


def post(client, text, dry_run=False):
    return client.post(f"/import/expenses?dry_run={str(dry_run).lower()}", json={"csv": text})


def test_template_is_public_and_importable(raw_client, client):
    """The template downloads without login and imports cleanly."""
    res = raw_client.get("/import/template")
    assert res.status_code == 200 and res.headers["content-type"].startswith("text/csv")
    result = post(client, TEMPLATE).json()
    assert result["imported"] == 5 and result["errors"] == []


def test_dry_run_saves_nothing(client):
    """A dry run reports what would happen without writing anything."""
    result = post(client, CSV, dry_run=True).json()
    assert result["valid"] == 3 and result["imported"] == 0
    assert [e["row"] for e in result["errors"]] == [5]
    assert result["new_categories"] == ["Travel"]
    assert client.get("/expenses?month=2026-11").json() == []


def test_import_creates_expenses_and_categories(client):
    """A real import saves valid rows, creates new categories and guesses blank ones."""
    result = post(client, CSV).json()
    assert result["imported"] == 3
    expenses = client.get("/expenses?month=2026-11").json()
    assert len(expenses) == 3
    categories = {c["id"]: c["name"] for c in client.get("/categories").json()}
    by_desc = {e["description"]: categories[e["category_id"]] for e in expenses}
    assert by_desc == {"Lunch": "Food", "Weekend trip": "Travel", "Swiggy order": "Food"}
    assert any(str(e["amount"]) in ("1200.50", "1200.5") for e in expenses)


def test_reimport_skips_duplicates(client):
    """Uploading the same file twice does not duplicate expenses."""
    post(client, CSV)
    again = post(client, CSV).json()
    assert again["imported"] == 0 and again["duplicates"] == 3
    assert len(client.get("/expenses?month=2026-11").json()) == 3


def test_bank_statement_columns(client):
    """Bank-style headers (Txn Date, Narration, Withdrawal Amt) are understood."""
    text = "Txn Date,Narration,Withdrawal Amt\n05-11-2026,UPI/Zomato/123,\"₹ 350\"\n06-11-2026,Salary credit,\n"
    result = post(client, text).json()
    assert result["imported"] == 1
    assert client.get("/expenses?month=2026-11").json()[0]["amount"] in ("350.00", "350.0", "350")


def test_missing_columns_rejected(client):
    """Files without date and amount columns return a clear 400 error."""
    res = post(client, "foo,bar\n1,2\n")
    assert res.status_code == 400 and "date" in res.json()["detail"]


def test_import_requires_login(raw_client):
    """Importing needs a signed-in user."""
    assert raw_client.post("/import/expenses", json={"csv": "date,amount\n"}).status_code == 401
