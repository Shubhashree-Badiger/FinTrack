"""Schemas for importing expenses from a CSV file."""
from pydantic import BaseModel, Field


class ImportIn(BaseModel):
    """CSV text sent by the UI (the browser reads the chosen file and posts its content)."""

    csv: str = Field(min_length=1, max_length=2_000_000)


class ImportRowError(BaseModel):
    """A row that could not be imported, with the reason."""

    row: int  # line number in the file, counting the header as line 1
    message: str


class ImportPreviewRow(BaseModel):
    """One row that will be (or was) imported."""

    date: str
    amount: str
    category: str
    description: str


class ImportOut(BaseModel):
    """Result of an import or a dry run."""

    dry_run: bool
    total_rows: int
    valid: int
    imported: int
    duplicates: int
    errors: list[ImportRowError]
    new_categories: list[str]
    preview: list[ImportPreviewRow]
