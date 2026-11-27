"""Category schemas."""
from pydantic import BaseModel, ConfigDict, Field, field_validator


class CategoryCreate(BaseModel):
    """Payload for creating a category."""

    name: str = Field(min_length=1, max_length=100)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        """Trim whitespace and reject blank names."""
        value = value.strip()
        if not value:
            raise ValueError("name must not be blank")
        return value


class CategoryOut(BaseModel):
    """Category returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
