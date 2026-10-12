from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select

from app.modules.admin.models import AdminUser, AuditLog
from app.modules.admin.security import hash_password
from app.modules.directory.models import Business, VerificationRecord

TEST_ADMIN_EMAIL = "verification-admin@example.org"
TEST_ADMIN_PASSWORD = "a-long-test-password"

CONFIRMED_CHECKLIST = {
    "existence_confirmed": "confirmed",
    "identity_consistent": "confirmed",
    "location_confirmed": "confirmed",
    "materials_confirmed": "confirmed",
    "dropoff_policy_confirmed": "confirmed",
    "notes": (
        "Official website and contact details checked; location, materials, "
        "and public drop-off policy confirmed."
    ),
}


def normalize_timestamp(value: str | datetime) -> datetime:
    timestamp = datetime.fromisoformat(value) if isinstance(value, str) else value
    return timestamp.astimezone(UTC)


def create_admin(db_session):
    admin = AdminUser(
        email=TEST_ADMIN_EMAIL,
        password_hash=hash_password(TEST_ADMIN_PASSWORD),
    )
    db_session.add(admin)
    db_session.commit()
    return admin


def login_admin(client, db_session):
    create_admin(db_session)

    response = client.post(
        "/api/admin/login",
        json={
            "email": TEST_ADMIN_EMAIL,
            "password": TEST_ADMIN_PASSWORD,
        },
    )

    assert response.status_code == 200


def create_business(
    db_session,
    *,
    name="Test Recycler",
    slug="test-recycler",
    verification_status="verified",
    last_verified_at=None,
    is_active=True,
):
    business = Business(
        name=name,
        slug=slug,
        business_type="recycler",
        accepts_public_dropoff="yes",
        verification_status=verification_status,
        last_verified_at=last_verified_at,
        is_active=is_active,
        source_url="https://example.org/recycler",
    )
    db_session.add(business)
    db_session.commit()
    return business


def test_needs_verification_endpoint_requires_authentication(client):
    response = client.get("/api/admin/businesses/needs-verification")

    assert response.status_code == 401


def test_needs_verification_includes_expired_business(client, db_session):
    login_admin(client, db_session)

    business = create_business(
        db_session,
        last_verified_at=datetime.now(UTC) - timedelta(days=366),
    )

    response = client.get("/api/admin/businesses/needs-verification")

    assert response.status_code == 200
    returned_ids = {item["id"] for item in response.json()}
    assert business.id in returned_ids


def test_needs_verification_includes_missing_verification_date(client, db_session):
    login_admin(client, db_session)

    business = create_business(db_session, last_verified_at=None)

    response = client.get("/api/admin/businesses/needs-verification")

    assert response.status_code == 200
    returned_ids = {item["id"] for item in response.json()}
    assert business.id in returned_ids


def test_needs_verification_includes_unverified_business(client, db_session):
    login_admin(client, db_session)

    business = create_business(
        db_session,
        verification_status="unverified",
        last_verified_at=datetime.now(UTC),
    )

    response = client.get("/api/admin/businesses/needs-verification")

    assert response.status_code == 200
    returned_ids = {item["id"] for item in response.json()}
    assert business.id in returned_ids


def test_needs_verification_excludes_inactive_business(client, db_session):
    login_admin(client, db_session)

    business = create_business(
        db_session,
        last_verified_at=datetime.now(UTC) - timedelta(days=400),
        is_active=False,
    )

    response = client.get("/api/admin/businesses/needs-verification")

    assert response.status_code == 200
    returned_ids = {item["id"] for item in response.json()}
    assert business.id not in returned_ids


def test_needs_verification_excludes_currently_verified_business(client, db_session):
    login_admin(client, db_session)

    business = create_business(
        db_session,
        last_verified_at=datetime.now(UTC) - timedelta(days=30),
    )

    response = client.get("/api/admin/businesses/needs-verification")

    assert response.status_code == 200
    returned_ids = {item["id"] for item in response.json()}
    assert business.id not in returned_ids


def test_verify_business_requires_authentication(client, db_session):
    business = create_business(
        db_session,
        last_verified_at=datetime.now(UTC) - timedelta(days=400),
    )

    response = client.post(
        f"/api/admin/businesses/{business.id}/verify",
        json=CONFIRMED_CHECKLIST,
    )

    assert response.status_code == 401


def test_verify_business_updates_timestamp_and_creates_record(client, db_session):
    login_admin(client, db_session)

    old_timestamp = datetime.now(UTC) - timedelta(days=400)
    business = create_business(
        db_session,
        verification_status="verified",
        last_verified_at=old_timestamp,
    )
    original_status = business.verification_status
    original_timestamp = business.last_verified_at

    response = client.post(
        f"/api/admin/businesses/{business.id}/verify",
        json=CONFIRMED_CHECKLIST,
    )

    assert response.status_code == 200
    assert response.json() == {"status": "verified"}

    db_session.refresh(business)
    assert business.verification_status == "verified"
    assert business.last_verified_at is not None
    assert business.last_verified_at > datetime.now(UTC) - timedelta(minutes=1)

    record = db_session.scalar(
        select(VerificationRecord).where(VerificationRecord.business_id == business.id)
    )
    assert record is not None
    assert record.status == "verified"
    assert "existence_confirmed" in record.notes
    assert "Official website and contact details checked" in record.notes

    record_count = db_session.scalar(
        select(func.count())
        .select_from(VerificationRecord)
        .where(VerificationRecord.business_id == business.id)
    )
    assert record_count == 1

    audit = db_session.scalar(
        select(AuditLog).where(
            AuditLog.entity == "business",
            AuditLog.entity_id == business.id,
            AuditLog.action == "verify_business",
        )
    )

    assert audit is not None
    assert audit.admin_id is not None
    assert audit.before == {
        "verification_status": original_status,
        "last_verified_at": original_timestamp.isoformat(),
    }
    assert audit.after["verification_status"] == "verified"
    assert normalize_timestamp(audit.after["last_verified_at"]) == normalize_timestamp(
        business.last_verified_at
    )
    assert audit.after["checklist"] == {
        "existence_confirmed": "confirmed",
        "identity_consistent": "confirmed",
        "location_confirmed": "confirmed",
        "materials_confirmed": "confirmed",
        "dropoff_policy_confirmed": "confirmed",
    }


def test_incomplete_checklist_keeps_business_unverified(client, db_session):
    login_admin(client, db_session)

    old_timestamp = datetime.now(UTC) - timedelta(days=400)
    business = create_business(
        db_session,
        verification_status="verified",
        last_verified_at=old_timestamp,
    )

    checklist = {
        **CONFIRMED_CHECKLIST,
        "location_confirmed": "unknown",
    }

    response = client.post(
        f"/api/admin/businesses/{business.id}/verify",
        json=checklist,
    )

    assert response.status_code == 200
    assert response.json() == {"status": "needs_review"}

    db_session.refresh(business)
    assert business.verification_status == "needs_review"
    assert business.last_verified_at is not None
    assert business.last_verified_at.date() == old_timestamp.date()

    record = db_session.scalar(
        select(VerificationRecord).where(VerificationRecord.business_id == business.id)
    )
    assert record is not None
    assert record.status == "needs_review"
    assert "location_confirmed" in record.notes
    assert "unknown" in record.notes

    audit = db_session.scalar(
        select(AuditLog).where(
            AuditLog.entity == "business",
            AuditLog.entity_id == business.id,
            AuditLog.action == "review_business",
        )
    )

    assert audit is not None
    assert audit.before["verification_status"] == "verified"
    assert normalize_timestamp(audit.before["last_verified_at"]) == normalize_timestamp(
        old_timestamp
    )
    assert audit.after["verification_status"] == "needs_review"
    assert normalize_timestamp(audit.after["last_verified_at"]) == normalize_timestamp(
        audit.before["last_verified_at"]
    )
    assert audit.after["checklist"]["location_confirmed"] == "unknown"


def test_not_confirmed_checklist_requires_review(client, db_session):
    login_admin(client, db_session)

    business = create_business(
        db_session,
        verification_status="unverified",
        last_verified_at=None,
    )

    checklist = {
        **CONFIRMED_CHECKLIST,
        "dropoff_policy_confirmed": "not_confirmed",
    }

    response = client.post(
        f"/api/admin/businesses/{business.id}/verify",
        json=checklist,
    )

    assert response.status_code == 200
    assert response.json() == {"status": "needs_review"}

    db_session.refresh(business)
    assert business.verification_status == "needs_review"
    assert business.last_verified_at is None


def test_invalid_checklist_answer_is_rejected(client, db_session):
    login_admin(client, db_session)

    business = create_business(db_session)

    checklist = {
        **CONFIRMED_CHECKLIST,
        "location_confirmed": "maybe",
    }

    response = client.post(
        f"/api/admin/businesses/{business.id}/verify",
        json=checklist,
    )

    assert response.status_code == 422

    db_session.refresh(business)
    assert business.verification_status == "verified"

    audit_count = db_session.scalar(
        select(func.count())
        .select_from(AuditLog)
        .where(
            AuditLog.entity == "business",
            AuditLog.entity_id == business.id,
        )
    )
    assert audit_count == 0


def test_inactive_business_cannot_be_verified(client, db_session):
    login_admin(client, db_session)

    business = create_business(
        db_session,
        is_active=False,
        last_verified_at=datetime.now(UTC) - timedelta(days=400),
    )

    response = client.post(
        f"/api/admin/businesses/{business.id}/verify",
        json=CONFIRMED_CHECKLIST,
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Inactive businesses cannot be verified."

    db_session.refresh(business)
    assert business.verification_status == "verified"

    record_count = db_session.scalar(
        select(func.count())
        .select_from(VerificationRecord)
        .where(VerificationRecord.business_id == business.id)
    )
    assert record_count == 0

    audit_count = db_session.scalar(
        select(func.count())
        .select_from(AuditLog)
        .where(
            AuditLog.entity == "business",
            AuditLog.entity_id == business.id,
        )
    )
    assert audit_count == 0


def test_verify_nonexistent_business_returns_404(client, db_session):
    login_admin(client, db_session)

    response = client.post(
        "/api/admin/businesses/999999/verify",
        json=CONFIRMED_CHECKLIST,
    )

    assert response.status_code == 404
