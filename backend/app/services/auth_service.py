"""Business logic for sign up and sign in."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import DEMO_USERNAME
from app.models import Category, User
from app.schemas.auth import LoginIn, RegisterIn, TokenOut, UserOut
from app.security import create_token, hash_password, verify_password
from app.services import ConflictError

# Every new account starts with these categories so the app is usable straight away.
DEFAULT_CATEGORIES = ["Food", "Transport", "Entertainment", "Bills", "Shopping", "Health", "Other"]


class AuthError(Exception):
    """Raised when credentials are wrong (mapped to HTTP 401)."""


def to_token(user: User) -> TokenOut:
    """Build the login response for a user."""
    out = UserOut(
        id=user.id, name=user.name, username=user.username, is_demo=user.username == DEMO_USERNAME
    )
    return TokenOut(token=create_token(user.id), user=out)


def register(db: Session, data: RegisterIn) -> TokenOut:
    """Create an account with default categories; raises ConflictError if the username is taken."""
    if db.scalar(select(User).where(User.username == data.username)):
        raise ConflictError("That username is already taken")
    user = User(name=data.name, username=data.username, password_hash=hash_password(data.password))
    db.add(user)
    db.flush()
    db.add_all(Category(user_id=user.id, name=name) for name in DEFAULT_CATEGORIES)
    db.commit()
    db.refresh(user)
    return to_token(user)


def login(db: Session, data: LoginIn) -> TokenOut:
    """Check the username and password; raises AuthError when they do not match."""
    user = db.scalar(select(User).where(User.username == data.username.strip().lower()))
    if user is None or not verify_password(data.password, user.password_hash):
        raise AuthError("Invalid username or password")
    return to_token(user)
