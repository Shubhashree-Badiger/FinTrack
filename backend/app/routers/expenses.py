"""Expense endpoints. Create and update also return the category's budget status."""
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import services
from app.database import get_db
from app.models import Category, Expense, User
from app.schemas import ExpenseIn, ExpenseOut, ExpenseSaved, MonthQuery
from app.security import get_current_user

router = APIRouter(prefix="/expenses", tags=["expenses"])


def get_own_category(db: Session, user: User, category_id: int) -> Category:
    """Return the user's category or raise 404."""
    category = db.get(Category, category_id)
    if category is None or category.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")
    return category


def get_own_expense(db: Session, user: User, expense_id: int) -> Expense:
    """Return the user's expense or raise 404."""
    expense = db.get(Expense, expense_id)
    if expense is None or expense.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Expense not found")
    return expense


def with_alert(db: Session, user: User, expense: Expense, category: Category) -> ExpenseSaved:
    """Attach the current budget status for the expense's category and month."""
    alert = services.category_alert(
        db, user.id, category, expense.spent_on.year, expense.spent_on.month
    )
    return ExpenseSaved(**ExpenseOut.model_validate(expense).model_dump(), alert=alert)


@router.get("", response_model=list[ExpenseOut])
def list_expenses(
    month: MonthQuery | None = None,
    category_id: int | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List the user's expenses, newest first, optionally filtered by month and category."""
    stmt = select(Expense).where(Expense.user_id == user.id)
    if month:
        start, end = services.month_bounds(*services.parse_month(month))
        stmt = stmt.where(Expense.spent_on >= start, Expense.spent_on < end)
    if category_id is not None:
        stmt = stmt.where(Expense.category_id == category_id)
    return db.scalars(stmt.order_by(Expense.spent_on.desc(), Expense.id.desc()))


@router.post("", response_model=ExpenseSaved, status_code=status.HTTP_201_CREATED)
def create_expense(
    data: ExpenseIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Log an expense and return it with the budget status."""
    category = get_own_category(db, user, data.category_id)
    expense = Expense(user_id=user.id, **data.model_dump())
    db.add(expense)
    db.commit()
    return with_alert(db, user, expense, category)


@router.put("/{expense_id}", response_model=ExpenseSaved)
def update_expense(
    expense_id: int,
    data: ExpenseIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Edit an expense and return it with the budget status."""
    expense = get_own_expense(db, user, expense_id)
    category = get_own_category(db, user, data.category_id)
    for field, value in data.model_dump().items():
        setattr(expense, field, value)
    db.commit()
    return with_alert(db, user, expense, category)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Delete an expense."""
    db.delete(get_own_expense(db, user, expense_id))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
