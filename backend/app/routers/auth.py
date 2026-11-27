"""Sign up, sign in, demo sign in and current user endpoints."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.config import DEMO_USERNAME
from app.database import get_db
from app.models import User
from app.schemas.auth import LoginIn, RegisterIn, TokenOut, UserOut
from app.services import auth_service, demo_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    """Create an account and sign in."""
    return auth_service.register(db, data)


@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    """Sign in with username and password."""
    return auth_service.login(db, data)


@router.post("/demo", response_model=TokenOut)
def demo(db: Session = Depends(get_db)):
    """Sign in as the shared demo user, whose data is refreshed for the current month."""
    return auth_service.to_token(demo_service.ensure_demo(db))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    """Return the signed-in user."""
    return UserOut(id=user.id, name=user.name, username=user.username,
                   is_demo=user.username == DEMO_USERNAME)
