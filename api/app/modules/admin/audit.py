from sqlalchemy.orm import Session

from app.modules.admin.models import AuditLog


def record_audit(
    db: Session,
    admin_id: int,
    action: str,
    entity: str,
    entity_id: int,
    before: dict | None,
    after: dict | None,
) -> None:
    db.add(
        AuditLog(
            admin_id=admin_id,
            action=action,
            entity=entity,
            entity_id=entity_id,
            before=before,
            after=after,
        )
    )
