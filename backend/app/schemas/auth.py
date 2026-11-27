"""Schemas for sign up, sign in and the current user."""
from pydantic import BaseModel, ConfigDict, Field, field_validator


class RegisterIn(BaseModel):
    """Payload for creating an account."""

    name: str = Field(min_length=1, max_length=100)
    username: str = Field(min_length=3, max_length=30, pattern=r"^[A-Za-z0-9_.]+$")
    password: str = Field(min_length=6, max_length=100)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        """Trim whitespace and reject blank names."""
        value = value.strip()
        if not value:
            raise ValueError("name must not be blank")
        return value

    @field_validator("username")
    @classmethod
    def lower_username(cls, value: str) -> str:
        """Usernames are case-insensitive, so store them in lower case."""
        return value.lower()


class LoginIn(BaseModel):
    """Payload for signing in."""

    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=100)


class UserOut(BaseModel):
    """Public user details."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    username: str | None
    is_demo: bool = False


class TokenOut(BaseModel):
    """Login result: a bearer token and the user it belongs to."""

    token: str
    user: UserOut
