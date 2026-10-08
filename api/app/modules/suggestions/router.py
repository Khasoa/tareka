from fastapi import APIRouter, Depends, Request
from sqlalchemy import select

from app.core.deps import DbSession
from app.core.rate_limit import limiter
from app.modules.admin.service import require_admin
from app.modules.suggestions.models import BusinessSuggestion
from app.modules.suggestions.schemas import SuggestionCreate

router = APIRouter(prefix="/api", tags=["suggestions"])


@router.post("/suggestions")
@limiter.limit("5/hour")
def create_suggestion(
    request: Request,
    body: SuggestionCreate,
    db: DbSession,
):
    if body.honeypot:
        return {"status": "ok"}

    suggestion = BusinessSuggestion(
        name=body.name,
        county=body.county,
        description_raw=body.description_raw,
        materials_raw=body.materials_raw,
        source_url=body.source_url,
        phone=body.phone,
        submitter_note=body.submitter_note,
        submitter_email=body.submitter_email,
    )

    db.add(suggestion)
    db.commit()

    return {"status": "ok"}


@router.get("/admin/suggestions")
def list_suggestions(
    db: DbSession,
    admin=Depends(require_admin),
):
    return db.scalars(
        select(BusinessSuggestion).order_by(BusinessSuggestion.created_at.desc())
    ).all()
