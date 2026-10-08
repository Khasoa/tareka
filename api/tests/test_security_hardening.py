from sqlalchemy import func, select

from app.modules.admin.models import AdminUser
from app.modules.claims.models import BusinessClaim
from app.modules.directory.models import Business
from app.modules.suggestions.models import BusinessSuggestion


def suggestion_payload(**overrides):
    payload = {
        "name": "Green Recovery Centre",
        "county": "Nairobi",
        "source_url": "https://example.org/recycling",
        "description_raw": "A local recycling service",
        "materials_raw": "plastic|paper",
        "submitter_email": "person@example.org",
    }
    payload.update(overrides)
    return payload


def test_invalid_suggestion_url_is_rejected(client, db_session):
    response = client.post(
        "/api/suggestions",
        json=suggestion_payload(source_url="javascript:alert(1)"),
    )

    assert response.status_code == 422
    assert db_session.scalar(select(func.count()).select_from(BusinessSuggestion)) == 0


def test_honeypot_submission_is_ignored(client, db_session):
    response = client.post(
        "/api/suggestions",
        json=suggestion_payload(honeypot="bot-filled-this"),
    )

    assert response.status_code == 202
    assert response.json() == {"status": "ok"}
    assert db_session.scalar(select(func.count()).select_from(BusinessSuggestion)) == 0


def test_valid_suggestion_is_staged(client, db_session):
    response = client.post(
        "/api/suggestions",
        json=suggestion_payload(),
    )

    assert response.status_code == 202
    suggestion = db_session.scalar(select(BusinessSuggestion))
    assert suggestion is not None
    assert suggestion.status == "new"

    # Submitting a suggestion must not create a canonical business.
    assert db_session.scalar(select(func.count()).select_from(Business)) == 0


def test_admin_endpoints_require_authentication(client):
    response = client.get("/api/admin/me")
    assert response.status_code == 401


def test_security_headers_are_present(client):
    response = client.get("/health")

    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "strict-origin-when-cross-origin"


def test_claim_requires_consent(client, db_session):
    business = Business(
        name="Consent Test Recycler",
        slug="consent-test-recycler",
        business_type="recycler",
        accepts_public_dropoff="yes",
        verification_status="verified",
    )
    db_session.add(business)
    db_session.commit()

    response = client.post(
        f"/api/businesses/{business.id}/claims",
        json={
            "claimant_name": "Test Claimant",
            "claimant_role": "Owner",
            "claimant_contact": "owner@example.org",
            "content_use_consent": False,
            "image_consent": False,
        },
    )

    assert response.status_code == 400
    assert db_session.scalar(select(func.count()).select_from(BusinessClaim)) == 0


def test_unknown_url_scheme_is_rejected_by_validator():
    import pytest

    from app.core.validation import validate_http_url

    with pytest.raises(ValueError):
        validate_http_url("file:///etc/passwd")

    with pytest.raises(ValueError):
        validate_http_url("javascript:alert(1)")


def test_admin_login_does_not_create_a_session_for_wrong_password(client, db_session):
    from app.modules.admin.models import AdminSession
    from app.modules.admin.security import hash_password

    db_session.add(
        AdminUser(
            email="admin@example.org",
            password_hash=hash_password("a-long-test-password"),
        )
    )
    db_session.commit()

    response = client.post(
        "/api/admin/login",
        json={
            "email": "admin@example.org",
            "password": "incorrect-test-password",
        },
    )

    assert response.status_code == 401
    assert db_session.scalar(select(func.count()).select_from(AdminSession)) == 0
