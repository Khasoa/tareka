from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select

from app.core.config import settings
from app.core.deps import DbSession
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
from app.modules.directory.models import Business, VerificationRecord

router = APIRouter(prefix="/api/admin", tags=["admin"])
limiter = Limiter(key_func=get_remote_address)


class LoginRequest(BaseModel):
    email: str
    password: str


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
