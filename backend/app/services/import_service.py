"""Import expenses from a CSV file (own template or a typical bank statement export)."""
import csv
import io
import re
from datetime import date, datetime
from decimal import Decimal, InvalidOperation

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Category, Expense
from app.schemas.importer import ImportOut, ImportPreviewRow, ImportRowError
from app.services import BadRequestError

MAX_ROWS = 2000
MAX_AMOUNT = Decimal("99999999.99")  # fits Numeric(10, 2)

TEMPLATE = (
    "date,amount,category,description\n"
    "2026-11-01,450.00,Food,Lunch with friends\n"
    "2026-11-02,120,Transport,Metro card recharge\n"
    "2026-11-03,799,Entertainment,Netflix subscription\n"
    "2026-11-04,2300.50,Bills,Electricity bill\n"
    "2026-11-05,1499,,Amazon order (category left blank: guessed from the description)\n"
)

# Accepted column names (lower case), so bank statement exports work without editing.
HEADER_ALIASES = {
    "date": {"date", "txn date", "transaction date", "value date", "posting date"},
    "amount": {"amount", "debit", "debit amount", "withdrawal", "withdrawal amt",
               "withdrawal amount", "dr", "amount (inr)"},
    "description": {"description", "narration", "particulars", "remarks", "details",
                    "transaction remarks", "transaction details"},
    "category": {"category"},
}

# Used when the category column is empty. Keywords are matched against the description.
KEYWORDS = {
    "Food": ["swiggy", "zomato", "restaurant", "cafe", "grocer", "bigbasket", "blinkit",
             "zepto", "dmart", "dominos", "pizza", "mcdonald", "bakery", "dinner", "lunch"],
    "Transport": ["uber", "ola ", "rapido", "metro", "irctc", "petrol", "fuel", "redbus",
                  "fastag", "bus", "cab"],
    "Entertainment": ["netflix", "hotstar", "spotify", "prime video", "bookmyshow", "movie",
                      "pvr", "inox", "youtube", "concert"],
    "Bills": ["electricity", "bescom", "airtel", "jio", "vodafone", "broadband", "recharge",
              "bill", "rent", "insurance", "gas", "water"],
    "Shopping": ["amazon", "flipkart", "myntra", "ajio", "meesho", "nykaa", "mall"],
    "Health": ["pharmacy", "apollo", "medplus", "hospital", "clinic", "1mg", "pharmeasy", "doctor"],
}

DATE_FORMATS = ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d/%m/%y", "%d-%m-%y", "%d %b %Y", "%d-%b-%Y")


def _parse_date(text: str) -> date:
    """Parse a date in one of the supported formats, or raise ValueError."""
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(text.strip(), fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Unrecognised date '{text}'. Use YYYY-MM-DD or DD/MM/YYYY")


def _parse_amount(text: str) -> Decimal | None:
    """Parse an amount like '1,250.50', '₹ 90' or '-45'. Returns None for an empty or zero cell."""
    cleaned = re.sub(r"(?i)rs\.?|inr|₹|,|\s", "", text or "")
    if not cleaned:
        return None
    try:
        value = abs(Decimal(cleaned)).quantize(Decimal("0.01"))
    except InvalidOperation:
        raise ValueError(f"Unrecognised amount '{text}'") from None
    if value == 0:
        return None
    if value > MAX_AMOUNT:
        raise ValueError("Amount is too large")
    return value


def _guess_category(description: str) -> str:
    """Pick a category name from keywords in the description, falling back to 'Other'."""
    text = f" {description.lower()} "
    for name, words in KEYWORDS.items():
        if any(word in text for word in words):
            return name
    return "Other"


def _map_headers(fieldnames: list[str] | None) -> dict[str, str]:
    """Map our field names to the file's column names; date and amount are required."""
    found: dict[str, str] = {}
    for original in fieldnames or []:
        key = (original or "").strip().lower()
        for field, aliases in HEADER_ALIASES.items():
            if key in aliases and field not in found:
                found[field] = original
    missing = [f for f in ("date", "amount") if f not in found]
    if missing:
        raise BadRequestError(
            "The file needs these columns: " + ", ".join(missing)
            + ". Download the template to see the expected format."
        )
    return found


def import_expenses(db: Session, user_id: int, text: str, dry_run: bool) -> ImportOut:
    """Validate every row of the CSV and, unless dry_run, save the valid ones.

    Rows that repeat an existing expense (same date, amount and description) are skipped, so
    uploading the same statement twice does not create duplicates.
    """
    reader = csv.DictReader(io.StringIO(text.lstrip("\ufeff")))
    columns = _map_headers(reader.fieldnames)
    rows = list(reader)
    if not rows:
        raise BadRequestError("The file has a header but no data rows.")
    if len(rows) > MAX_ROWS:
        raise BadRequestError(f"Too many rows ({len(rows)}). Import at most {MAX_ROWS} at a time.")

    categories = {c.name.lower(): c for c in db.scalars(select(Category).where(Category.user_id == user_id))}
    errors: list[ImportRowError] = []
    parsed: list[tuple[date, Decimal, str, str]] = []
    for line, row in enumerate(rows, start=2):
        try:
            amount = _parse_amount(row.get(columns["amount"]) or "")
            if amount is None:
                continue  # blank or zero (for example a credit row in a statement): nothing to import
            spent_on = _parse_date(row.get(columns["date"]) or "")
            description = ((row.get(columns.get("description", "")) or "").strip())[:255]
            name = (row.get(columns.get("category", "")) or "").strip() or _guess_category(description)
            parsed.append((spent_on, amount, name[:100], description))
        except ValueError as exc:
            errors.append(ImportRowError(row=line, message=str(exc)))

    existing: set[tuple[date, Decimal, str]] = set()
    if parsed:
        low, high = min(p[0] for p in parsed), max(p[0] for p in parsed)
        stmt = select(Expense.spent_on, Expense.amount, Expense.description).where(
            Expense.user_id == user_id, Expense.spent_on >= low, Expense.spent_on <= high
        )
        existing = {(d, Decimal(a), (desc or "").strip().lower()) for d, a, desc in db.execute(stmt)}

    to_save, duplicates, new_names = [], 0, []
    for spent_on, amount, name, description in parsed:
        key = (spent_on, amount, description.lower())
        if key in existing:
            duplicates += 1
            continue
        existing.add(key)
        to_save.append((spent_on, amount, name, description))
        if name.lower() not in categories and name not in new_names:
            new_names.append(name)

    if not dry_run:
        for name in new_names:
            category = Category(user_id=user_id, name=name)
            db.add(category)
            categories[name.lower()] = category
        db.flush()
        db.add_all(
            Expense(user_id=user_id, category_id=categories[name.lower()].id, amount=amount,
                    description=description, spent_on=spent_on)
            for spent_on, amount, name, description in to_save
        )
        db.commit()

    preview = [
        ImportPreviewRow(date=d.isoformat(), amount=str(a), category=n, description=desc)
        for d, a, n, desc in to_save[:8]
    ]
    return ImportOut(
        dry_run=dry_run, total_rows=len(rows), valid=len(to_save),
        imported=0 if dry_run else len(to_save), duplicates=duplicates,
        errors=errors[:50], new_categories=new_names, preview=preview,
    )
