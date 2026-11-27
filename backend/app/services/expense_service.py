"""Business logic for categories and expenses."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import DEFAULT_USER_ID
from app.models import Category, Expense
from app.schemas.category import CategoryCreate
from app.schemas.expense import ExpenseCreate, ExpenseUpdate
from app.services import ConflictError, NotFoundError, month_bounds, parse_month


def list_categories(db: Session) -> list[Category]:
    """Return all categories of the default user, ordered by name."""
    stmt = select(Category).where(Category.user_id == DEFAULT_USER_ID).order_by(Category.name)
    return list(db.scalars(stmt))


def create_category(db: Session, data: CategoryCreate) -> Category:
    """Create a category; raises ConflictError if the name already exists."""
    exists = db.scalar(
        select(Category).where(Category.user_id == DEFAULT_USER_ID, Category.name == data.name)
    )
    if exists:
        raise ConflictError(f"Category '{data.name}' already exists")
    category = Category(user_id=DEFAULT_USER_ID, name=data.name)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def get_category(db: Session, category_id: int) -> Category:
    """Return a category or raise NotFoundError."""
    category = db.get(Category, category_id)
    if category is None or category.user_id != DEFAULT_USER_ID:
        raise NotFoundError(f"Category {category_id} not found")
    return category


def list_expenses(
    db: Session, month: str | None = None, category_id: int | None = None
) -> list[Expense]:
    """Return expenses, newest first, optionally filtered by 'YYYY-MM' month and category."""
    stmt = select(Expense).where(Expense.user_id == DEFAULT_USER_ID)
    if month:
        start, end = month_bounds(*parse_month(month))
        stmt = stmt.where(Expense.spent_on >= start, Expense.spent_on < end)
    if category_id is not None:
        stmt = stmt.where(Expense.category_id == category_id)
    return list(db.scalars(stmt.order_by(Expense.spent_on.desc(), Expense.id.desc())))


def get_expense(db: Session, expense_id: int) -> Expense:
    """Return an expense or raise NotFoundError."""
    expense = db.get(Expense, expense_id)
    if expense is None or expense.user_id != DEFAULT_USER_ID:
        raise NotFoundError(f"Expense {expense_id} not found")
    return expense


def create_expense(db: Session, data: ExpenseCreate) -> Expense:
    """Save a new expense."""
    get_category(db, data.category_id)
    expense = Expense(user_id=DEFAULT_USER_ID, **data.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


def update_expense(db: Session, expense_id: int, data: ExpenseUpdate) -> Expense:
    """Replace the fields of an existing expense."""
    expense = get_expense(db, expense_id)
    get_category(db, data.category_id)
    for field, value in data.model_dump().items():
        setattr(expense, field, value)
    db.commit()
    db.refresh(expense)
    return expense


def delete_expense(db: Session, expense_id: int) -> None:
    """Delete an expense."""
    db.delete(get_expense(db, expense_id))
    db.commit()
