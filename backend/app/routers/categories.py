"""Category endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Category, User
from app.schemas import CategoryIn, CategoryOut
from app.security import get_current_user

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut])
def list_categories(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List the user's categories."""
    return db.scalars(select(Category).where(Category.user_id == user.id).order_by(Category.name))


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    data: CategoryIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Create a category; names are unique per user."""
    name = data.name.strip()
    if not name:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Name must not be blank")
    if db.scalar(select(Category).where(Category.user_id == user.id, Category.name == name)):
        raise HTTPException(status.HTTP_409_CONFLICT, f"Category '{name}' already exists")
    category = Category(user_id=user.id, name=name)
    db.add(category)
    db.commit()
    return category
