"""Expense endpoints."""
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.budget import MonthQuery
from app.schemas.expense import ExpenseCreate, ExpenseOut, ExpenseSaved, ExpenseUpdate
from app.services import expense_service

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("", response_model=list[ExpenseOut])
def list_expenses(
    month: MonthQuery | None = None,
    category_id: int | None = None,
    db: Session = Depends(get_db),
):
    """List expenses, optionally filtered by month and category."""
    return expense_service.list_expenses(db, month, category_id)


@router.post("", response_model=ExpenseSaved, status_code=status.HTTP_201_CREATED)
def create_expense(data: ExpenseCreate, db: Session = Depends(get_db)):
    """Create an expense."""
    return expense_service.create_expense(db, data)


@router.put("/{expense_id}", response_model=ExpenseSaved)
def update_expense(expense_id: int, data: ExpenseUpdate, db: Session = Depends(get_db)):
    """Update an expense."""
    return expense_service.update_expense(db, expense_id, data)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    """Delete an expense."""
    expense_service.delete_expense(db, expense_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
