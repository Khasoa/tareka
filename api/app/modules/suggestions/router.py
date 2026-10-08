from fastapi import APIRouter, Depends, Request, status
from sqlalchemy import select

from app.core.deps import DbSession
from app.core.rate_limit import limiter
from app.modules.admin.models import AdminUser
from app.modules.admin.service import require_admin
from app.modules.suggestions.models import BusinessSuggestion
from app.modules.suggestions.schemas import (
    SuggestionCreate,
    SuggestionResponse,
)

router = APIRouter(
    prefix="/api",
    tags=["suggestions"],
)


@router.post(
    "/suggestions",
    status_code=status.HTTP_202_ACCEPTED,
)
@limiter.limit("5/hour")
def create_suggestion(
    request: Request,
    body: SuggestionCreate,
    db: DbSession,
) -> dict[str, str]:
    if body.honeypot:
        return {"status": "ok"}

    suggestion = BusinessSuggestion(
        name=body.name.strip(),
        county=body.county.strip(),
        description_raw=body.description_raw,
        materials_raw=body.materials_raw,
        source_url=body.source_url,
        phone=body.phone,
        submitter_note=body.submitter_note,
        submitter_email=body.submitter_email,
        status="new",
    )

    db.add(suggestion)
    db.commit()

    return {"status": "ok"}


@router.get(
    "/admin/suggestions",
    response_model=list[SuggestionResponse],
)
def list_suggestions(
    db: DbSession,
    admin: AdminUser = Depends(require_admin),
) -> list[BusinessSuggestion]:
    return list(
        db.scalars(
            select(BusinessSuggestion).order_by(BusinessSuggestion.created_at.desc())
        ).all()
    )
