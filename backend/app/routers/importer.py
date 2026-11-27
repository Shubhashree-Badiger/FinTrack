"""CSV import endpoints: a downloadable template and the import itself."""
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.schemas.importer import ImportIn, ImportOut
from app.services import import_service

router = APIRouter(prefix="/import", tags=["import"])


@router.get("/template")
def template() -> Response:
    """Download a sample CSV with the expected columns."""
    return Response(
        content=import_service.TEMPLATE,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="fintrack-expenses-template.csv"'},
    )


@router.post("/expenses", response_model=ImportOut)
def import_expenses(
    data: ImportIn,
    dry_run: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Import expenses from CSV text. With dry_run=true nothing is saved; the result is a preview."""
    return import_service.import_expenses(db, user.id, data.csv, dry_run)
