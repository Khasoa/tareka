from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.core.deps import DbSession
from app.core.rate_limit import limiter
from app.core.validation import validate_http_url
from app.modules.admin.audit import record_audit
from app.modules.admin.models import AdminSession, AdminUser
from app.modules.admin.security import (
    LOCKOUT_DURATION,
    MAX_FAILED_ATTEMPTS,
    generate_session_token,
    hash_session_token,
    session_expiry,
    verify_password,
)
from app.modules.admin.service import require_admin
from app.modules.directory.models import (
    Business,
    BusinessMaterial,
    Location,
    Material,
    VerificationRecord,
)
from app.modules.suggestions.models import BusinessSuggestion

router = APIRouter(prefix="/api/admin", tags=["admin"])


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=200)
    password: str = Field(min_length=1, max_length=1024)


class PublishSuggestionRequest(BaseModel):
    slug: str = Field(min_length=2, max_length=220)
    business_type: str
    accepts_public_dropoff: str
    description: str = Field(min_length=1, max_length=5000)
    town: str | None = Field(default=None, max_length=100)
    website_url: str | None = Field(default=None, max_length=500)
    phone: str | None = Field(default=None, max_length=50)
    material_ids: list[int] = Field(default_factory=list)


@router.post("/login")
@limiter.limit("5/minute")
def login(
    request: Request,
    body: LoginRequest,
    response: Response,
    db: DbSession,
) -> dict[str, str]:
    email = body.email.strip().lower()
    admin = db.scalar(select(AdminUser).where(AdminUser.email == email))
    now = datetime.now(UTC)

    # Use a generic error for unknown emails and incorrect passwords.
    if admin is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if admin.locked_until is not None:
        locked_until = admin.locked_until
        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(tzinfo=UTC)

        if locked_until > now:
            raise HTTPException(
                status_code=423,
                detail="Account temporarily locked. Try again later.",
            )

    if not verify_password(body.password, admin.password_hash):
        admin.failed_attempts += 1

        if admin.failed_attempts >= MAX_FAILED_ATTEMPTS:
            admin.locked_until = now + LOCKOUT_DURATION

        db.commit()
        raise HTTPException(status_code=401, detail="Invalid email or password")

    admin.failed_attempts = 0
    admin.locked_until = None

    # Store only the hash of the random session token in the database.
    token = generate_session_token()
    db.add(
        AdminSession(
            admin_id=admin.id,
            token_hash=hash_session_token(token),
            expires_at=session_expiry(),
        )
    )
    db.commit()

    response.set_cookie(
        key="tareka_session",
        value=token,
        httponly=True,
        secure=settings.environment == "production",
        samesite="lax",
        max_age=12 * 60 * 60,
        path="/",
    )
    return {"status": "ok"}


@router.post("/logout")
def logout(
    response: Response,
    db: DbSession,
    admin: AdminUser = Depends(require_admin),
) -> dict[str, str]:
    sessions = db.scalars(
        select(AdminSession).where(AdminSession.admin_id == admin.id)
    ).all()

    for session in sessions:
        db.delete(session)

    db.commit()
    response.delete_cookie(
        key="tareka_session",
        path="/",
        secure=settings.environment == "production",
        httponly=True,
        samesite="lax",
    )
    return {"status": "ok"}


@router.get("/me")
def get_current_admin(
    admin: AdminUser = Depends(require_admin),
) -> dict[str, str]:
    return {"email": admin.email}


@router.post("/businesses/{business_id}/verify")
def verify_business(
    business_id: int,
    db: DbSession,
    admin: AdminUser = Depends(require_admin),
) -> dict[str, str]:
    business = db.get(Business, business_id)
    if business is None:
        raise HTTPException(status_code=404, detail="Business not found")

    now = datetime.now(UTC)
    before = {
        "verification_status": business.verification_status,
        "last_verified_at": (
            business.last_verified_at.isoformat() if business.last_verified_at else None
        ),
    }

    business.verification_status = "verified"
    business.last_verified_at = now

    db.add(
        VerificationRecord(
            business_id=business.id,
            status="verified",
            verified_at=now,
            source_type="admin_research",
            source_url=business.source_url,
            notes="Verified by an administrator.",
        )
    )

    record_audit(
        db,
        admin_id=admin.id,
        action="verify_business",
        entity="business",
        entity_id=business.id,
        before=before,
        after={
            "verification_status": "verified",
            "last_verified_at": now.isoformat(),
        },
    )

    db.commit()
    return {"status": "verified"}


@router.post("/suggestions/{suggestion_id}/publish")
def publish_suggestion(
    suggestion_id: int,
    body: PublishSuggestionRequest,
    db: DbSession,
    admin: AdminUser = Depends(require_admin),
) -> dict[str, int | str]:
    suggestion = db.get(BusinessSuggestion, suggestion_id)
    if suggestion is None:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    if suggestion.status != "new":
        raise HTTPException(
            status_code=409,
            detail="Only new suggestions can be published.",
        )

    slug = body.slug.strip().lower()
    if db.scalar(select(Business).where(Business.slug == slug)) is not None:
        raise HTTPException(
            status_code=409,
            detail="A business with this slug already exists.",
        )

    if body.business_type not in {"recycler", "upcycler", "collector", "mixed"}:
        raise HTTPException(status_code=422, detail="Invalid business type.")

    if body.accepts_public_dropoff not in {"yes", "no", "unknown"}:
        raise HTTPException(status_code=422, detail="Invalid drop-off value.")

    website_url = None
    try:
        website_url = validate_http_url(body.website_url)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    material_ids = set(body.material_ids)
    materials = (
        list(db.scalars(select(Material).where(Material.id.in_(material_ids))).all())
        if material_ids
        else []
    )

    if len(materials) != len(material_ids):
        raise HTTPException(
            status_code=422,
            detail="One or more selected materials do not exist.",
        )

    now = datetime.now(UTC)
    business = Business(
        name=suggestion.name,
        slug=slug,
        business_type=body.business_type,
        accepts_public_dropoff=body.accepts_public_dropoff,
        description=body.description.strip(),
        website_url=website_url,
        phone=(body.phone or suggestion.phone or "").strip() or None,
        source_type="admin_research",
        source_url=suggestion.source_url,
        verification_status="verified",
        last_verified_at=now,
    )

    try:
        db.add(business)
        db.flush()

        db.add(
            Location(
                business_id=business.id,
                county=suggestion.county,
                town=(body.town or "").strip() or None,
            )
        )

        for material in materials:
            db.add(
                BusinessMaterial(
                    business_id=business.id,
                    material_id=material.id,
                )
            )

        db.add(
            VerificationRecord(
                business_id=business.id,
                status="verified",
                verified_at=now,
                source_type="admin_research",
                source_url=suggestion.source_url,
                notes="Published after administrator research and review.",
            )
        )

        suggestion.status = "published"

        record_audit(
            db,
            admin_id=admin.id,
            action="publish_suggestion",
            entity="business_suggestion",
            entity_id=suggestion.id,
            before={"status": "new"},
            after={
                "status": "published",
                "business_id": business.id,
                "business_slug": slug,
            },
        )

        db.commit()
        return {"status": "published", "business_id": business.id}

    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="The business could not be published because it conflicts "
            "with an existing record.",
        ) from exc


@router.post("/suggestions/{suggestion_id}/reject")
def reject_suggestion(
    suggestion_id: int,
    db: DbSession,
    admin: AdminUser = Depends(require_admin),
) -> dict[str, str]:
    suggestion = db.get(BusinessSuggestion, suggestion_id)
    if suggestion is None:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    if suggestion.status != "new":
        raise HTTPException(
            status_code=409,
            detail="Only new suggestions can be rejected.",
        )

    suggestion.status = "rejected"

    record_audit(
        db,
        admin_id=admin.id,
        action="reject_suggestion",
        entity="business_suggestion",
        entity_id=suggestion.id,
        before={"status": "new"},
        after={"status": "rejected"},
    )

    db.commit()
    return {"status": "rejected"}
