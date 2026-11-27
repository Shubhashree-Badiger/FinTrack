"""Expense endpoints."""
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.schemas.budget import MonthQuery
from app.schemas.expense import ExpenseCreate, ExpenseOut, ExpenseSaved, ExpenseUpdate
from app.services import expense_service

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("", response_model=list[ExpenseOut])
def list_expenses(
    month: MonthQuery | None = None,
    category_id: int | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List expenses, optionally filtered by month and category."""
    return expense_service.list_expenses(db, user.id, month, category_id)


@router.post("", response_model=ExpenseSaved, status_code=status.HTTP_201_CREATED)
def create_expense(data: ExpenseCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Create an expense."""
    return expense_service.create_expense(db, user.id, data)


@router.put("/{expense_id}", response_model=ExpenseSaved)
def update_expense(expense_id: int, data: ExpenseUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Update an expense."""
    return expense_service.update_expense(db, user.id, expense_id, data)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Delete an expense."""
    expense_service.delete_expense(db, user.id, expense_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
