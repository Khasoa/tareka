from datetime import UTC, datetime

from fastapi import Cookie, HTTPException, status
from sqlalchemy import select

from app.core.deps import DbSession
from app.modules.admin.models import AdminSession, AdminUser
from app.modules.admin.security import hash_session_token


def require_admin(
    db: DbSession,
    tareka_session: str | None = Cookie(default=None),
) -> AdminUser:
    if not tareka_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    token_hash = hash_session_token(tareka_session)

    session = db.scalar(
        select(AdminSession).where(AdminSession.token_hash == token_hash)
    )

    if not session or session.expires_at < datetime.now(UTC):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired",
        )

    admin = db.get(AdminUser, session.admin_id)

    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    return admin
