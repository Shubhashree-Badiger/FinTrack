"""ORM models: users, categories, expenses and monthly budgets."""
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, ForeignKey, Numeric, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class User(Base):
    """A registered user. Every other record belongs to one user."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))


class Category(Base):
    """Expense category such as Food or Transport; name is unique per user."""

    __tablename__ = "categories"
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_category_user_name"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(100))


class Expense(Base):
    """A single spending record."""

    __tablename__ = "expenses"
    __table_args__ = (CheckConstraint("amount > 0", name="ck_expense_amount_positive"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    description: Mapped[str] = mapped_column(String(255), default="")
    spent_on: Mapped[date]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class Budget(Base):
    """Budget of one category for one month; unique per (category, month, year)."""

    __tablename__ = "budgets"
    __table_args__ = (
        UniqueConstraint("category_id", "month", "year", name="uq_budget_category_month_year"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    month: Mapped[int]
    year: Mapped[int]
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
