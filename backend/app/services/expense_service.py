"""Business logic for categories and expenses."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Category, Expense
from app.schemas.category import CategoryCreate
from app.schemas.expense import ExpenseCreate, ExpenseOut, ExpenseSaved, ExpenseUpdate
from app.services.alert_service import get_category_alert
from app.services import ConflictError, NotFoundError, month_bounds, parse_month


def list_categories(db: Session, user_id: int) -> list[Category]:
    """Return all categories of the user, ordered by name."""
    stmt = select(Category).where(Category.user_id == user_id).order_by(Category.name)
    return list(db.scalars(stmt))


def create_category(db: Session, user_id: int, data: CategoryCreate) -> Category:
    """Create a category; raises ConflictError if the name already exists."""
    exists = db.scalar(
        select(Category).where(Category.user_id == user_id, Category.name == data.name)
    )
    if exists:
        raise ConflictError(f"Category '{data.name}' already exists")
    category = Category(user_id=user_id, name=data.name)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def get_category(db: Session, user_id: int, category_id: int) -> Category:
    """Return a category or raise NotFoundError."""
    category = db.get(Category, category_id)
    if category is None or category.user_id != user_id:
        raise NotFoundError(f"Category {category_id} not found")
    return category


def list_expenses(
    db: Session, user_id: int, month: str | None = None, category_id: int | None = None
) -> list[Expense]:
    """Return expenses, newest first, optionally filtered by 'YYYY-MM' month and category."""
    stmt = select(Expense).where(Expense.user_id == user_id)
    if month:
        start, end = month_bounds(*parse_month(month))
        stmt = stmt.where(Expense.spent_on >= start, Expense.spent_on < end)
    if category_id is not None:
        stmt = stmt.where(Expense.category_id == category_id)
    return list(db.scalars(stmt.order_by(Expense.spent_on.desc(), Expense.id.desc())))


def get_expense(db: Session, user_id: int, expense_id: int) -> Expense:
    """Return an expense or raise NotFoundError."""
    expense = db.get(Expense, expense_id)
    if expense is None or expense.user_id != user_id:
        raise NotFoundError(f"Expense {expense_id} not found")
    return expense


def _with_alert(db: Session, user_id: int, expense: Expense) -> ExpenseSaved:
    """Attach the current alert of the expense's category and month to the expense."""
    category = get_category(db, user_id, expense.category_id)
    alert = get_category_alert(db, user_id, category, expense.spent_on.year, expense.spent_on.month)
    return ExpenseSaved(**ExpenseOut.model_validate(expense).model_dump(), alert=alert)


def create_expense(db: Session, user_id: int, data: ExpenseCreate) -> ExpenseSaved:
    """Save a new expense and return it with the current alert status."""
    get_category(db, user_id, data.category_id)
    expense = Expense(user_id=user_id, **data.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return _with_alert(db, user_id, expense)


def update_expense(db: Session, user_id: int, expense_id: int, data: ExpenseUpdate) -> ExpenseSaved:
    """Replace the fields of an existing expense and return it with the current alert status."""
    expense = get_expense(db, user_id, expense_id)
    get_category(db, user_id, data.category_id)
    for field, value in data.model_dump().items():
        setattr(expense, field, value)
    db.commit()
    db.refresh(expense)
    return _with_alert(db, user_id, expense)


def delete_expense(db: Session, user_id: int, expense_id: int) -> None:
    """Delete an expense."""
    db.delete(get_expense(db, user_id, expense_id))
    db.commit()
