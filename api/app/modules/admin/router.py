from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.core.config import settings
from app.core.deps import DbSession
from app.core.rate_limit import limiter
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
    email: str
    password: str


class PublishSuggestionRequest(BaseModel):
    slug: str
    business_type: str
    accepts_public_dropoff: str
    description: str
    town: str | None = None
    website_url: str | None = None
    phone: str | None = None
    material_ids: list[int] = Field(default_factory=list)


@router.post("/login")
@limiter.limit("5/minute")
def login(
    request: Request,
    body: LoginRequest,
    response: Response,
    db: DbSession,
):
    admin = db.scalar(select(AdminUser).where(AdminUser.email == body.email))

    if admin and admin.locked_until and admin.locked_until > datetime.now(UTC):
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Account temporarily locked",
        )

    if not admin or not verify_password(body.password, admin.password_hash):
        if admin:
            admin.failed_attempts += 1

            if admin.failed_attempts >= MAX_FAILED_ATTEMPTS:
                admin.locked_until = datetime.now(UTC) + LOCKOUT_DURATION

            db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    admin.failed_attempts = 0
    admin.locked_until = None

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
    )

    return {"status": "ok"}


@router.post("/logout")
def logout(
    response: Response,
    db: DbSession,
    admin: AdminUser = Depends(require_admin),
):
    db.query(AdminSession).filter(AdminSession.admin_id == admin.id).delete()

    db.commit()

    response.delete_cookie("tareka_session")

    return {"status": "ok"}


@router.get("/me")
def me(admin: AdminUser = Depends(require_admin)):
    return {"email": admin.email}


@router.post("/businesses/{business_id}/verify")
def verify_business(
    business_id: int,
    db: DbSession,
    admin: AdminUser = Depends(require_admin),
):
    business = db.get(Business, business_id)

    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found",
        )

    before = {
        "verification_status": business.verification_status,
        "last_verified_at": str(business.last_verified_at),
    }

    now = datetime.now(UTC)

    business.verification_status = "verified"
    business.last_verified_at = now

    db.add(
        VerificationRecord(
            business_id=business.id,
            status="verified",
            verified_at=now,
            source_type="admin_research",
            notes="Verified via admin panel",
        )
    )

    db.flush()

    after = {
        "verification_status": business.verification_status,
        "last_verified_at": str(business.last_verified_at),
    }

    record_audit(
        db,
        admin.id,
        "VERIFY_BUSINESS",
        "business",
        business.id,
        before,
        after,
    )

    db.commit()

    return {"status": "ok"}


@router.post("/suggestions/{suggestion_id}/publish")
def publish_suggestion(
    suggestion_id: int,
    body: PublishSuggestionRequest,
    db: DbSession,
    admin: AdminUser = Depends(require_admin),
):
    suggestion = db.get(BusinessSuggestion, suggestion_id)

    if not suggestion or suggestion.status == "published":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Suggestion not found or already published",
        )

    materials = []

    if body.material_ids:
        materials = list(
            db.scalars(select(Material).where(Material.id.in_(body.material_ids))).all()
        )

        if len(materials) != len(set(body.material_ids)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more material IDs do not exist",
            )

    now = datetime.now(UTC)

    business = Business(
        name=suggestion.name,
        slug=body.slug,
        business_type=body.business_type,
        accepts_public_dropoff=body.accepts_public_dropoff,
        description=body.description,
        website_url=body.website_url,
        phone=body.phone,
        source_type="admin_research",
        source_url=suggestion.source_url,
        verification_status="verified",
        last_verified_at=now,
    )

    db.add(business)
    db.flush()

    db.add(
        Location(
            business_id=business.id,
            county=suggestion.county,
            town=body.town,
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
            notes="Published from suggestion",
        )
    )

    suggestion.status = "published"

    record_audit(
        db,
        admin.id,
        "PUBLISH_SUGGESTION",
        "business",
        business.id,
        None,
        {
            "slug": business.slug,
            "source_suggestion_id": suggestion.id,
        },
    )

    db.commit()

    return {
        "status": "ok",
        "business_id": business.id,
    }
