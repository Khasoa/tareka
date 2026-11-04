from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select

from app.core.config import Settings
from app.core.origins import origin_is_trusted, trusted_browser_origins
from app.main import api_documentation_enabled
from app.modules.admin.models import AdminSession, AdminUser
from app.modules.admin.security import hash_password, hash_session_token
from app.modules.claims.models import BusinessClaim
from app.modules.directory.models import Business
from app.modules.suggestions.models import BusinessSuggestion
from tests.conftest import browser_origin, make_business


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


def login_admin(
    client, db_session, *, email="admin@example.org", password="a-long-test-password"
):
    db_session.add(
        AdminUser(
            email=email,
            password_hash=hash_password(password),
        )
    )
    db_session.commit()
    response = client.post(
        "/api/admin/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    return response


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

    assert db_session.scalar(select(func.count()).select_from(Business)) == 0


def test_admin_endpoints_require_authentication(client):
    response = client.get("/api/admin/me")
    assert response.status_code == 401


def test_security_headers_are_present(client):
    response = client.get("/health")

    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "strict-origin-when-cross-origin"


def test_claim_without_consent_is_accepted(client, db_session):
    business = make_business(
        "recycler",
        name="Consent Test Recycler",
        slug="consent-test-recycler",
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

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

    claim = db_session.scalar(select(BusinessClaim))
    assert claim is not None
    assert claim.content_use_consent is False
    assert claim.image_consent is False
    assert claim.status == "pending"


def test_claim_honeypot_submission_is_ignored(client, db_session):
    business = make_business(
        "recycler",
        name="Honeypot Claim Business",
        slug="honeypot-claim-business",
        accepts_public_dropoff="yes",
        verification_status="verified",
    )
    db_session.add(business)
    db_session.commit()

    response = client.post(
        f"/api/businesses/{business.id}/claims",
        json={
            "claimant_name": "Bot",
            "claimant_role": "Owner",
            "claimant_contact": "bot@example.org",
            "content_use_consent": False,
            "image_consent": False,
            "honeypot": "filled",
        },
    )

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert db_session.scalar(select(func.count()).select_from(BusinessClaim)) == 0


def test_unknown_url_scheme_is_rejected_by_validator():
    import pytest

    from app.core.validation import validate_http_url

    with pytest.raises(ValueError):
        validate_http_url("file:///etc/passwd")

    with pytest.raises(ValueError):
        validate_http_url("javascript:alert(1)")


def test_admin_login_does_not_create_a_session_for_wrong_password(client, db_session):
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


def test_login_sets_session_cookie(client, db_session):
    response = login_admin(client, db_session)
    session_count = db_session.scalar(select(func.count()).select_from(AdminSession))
    assert session_count == 1

    set_cookie = response.headers.get("set-cookie", "")
    assert "tareka_session=" in set_cookie
    assert "httponly" in set_cookie.lower()
    assert "samesite=lax" in set_cookie.lower()
    assert "path=/" in set_cookie.lower()


def test_authenticated_admin_request_with_session_cookie(client, db_session):
    login_admin(client, db_session)
    response = client.get("/api/admin/me")
    assert response.status_code == 200
    assert response.json()["email"] == "admin@example.org"


def test_unauthorised_admin_mutation_is_rejected(client, db_session):
    business = make_business(
        "recycler",
        name="Protected Business",
        slug="protected-business",
        accepts_public_dropoff="yes",
        verification_status="verified",
    )
    db_session.add(business)
    db_session.commit()

    response = client.patch(
        f"/api/admin/businesses/{business.id}/services",
        json={"accepts_public_dropoff": "no", "offers_pickup": "unknown"},
    )
    assert response.status_code == 401


def test_missing_origin_on_state_changing_request_is_rejected(client):
    response = client.post(
        "/api/suggestions",
        json=suggestion_payload(),
        headers={"Origin": ""},
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Origin header required"


def test_untrusted_origin_on_login_is_rejected(client, db_session):
    db_session.add(
        AdminUser(
            email="admin@example.org",
            password_hash=hash_password("a-long-test-password"),
        )
    )
    db_session.commit()

    response = client.post(
        "/api/admin/login",
        json={"email": "admin@example.org", "password": "a-long-test-password"},
        headers={"Origin": "https://evil.example"},
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Origin not allowed"


def test_logout_invalidates_current_session_only(client, db_session):
    admin = AdminUser(
        email="admin@example.org",
        password_hash=hash_password("a-long-test-password"),
    )
    db_session.add(admin)
    db_session.flush()

    other_token = "other-device-token-value"
    current_token = "current-device-token-value"
    db_session.add(
        AdminSession(
            admin_id=admin.id,
            token_hash=hash_session_token(other_token),
            expires_at=datetime.now(UTC) + timedelta(hours=1),
        )
    )
    db_session.add(
        AdminSession(
            admin_id=admin.id,
            token_hash=hash_session_token(current_token),
            expires_at=datetime.now(UTC) + timedelta(hours=1),
        )
    )
    db_session.commit()

    client.cookies.set("tareka_session", current_token)
    response = client.post("/api/admin/logout")
    assert response.status_code == 200

    remaining = db_session.scalars(select(AdminSession)).all()
    assert len(remaining) == 1
    assert remaining[0].token_hash == hash_session_token(other_token)


def test_expired_session_is_rejected(client, db_session):
    admin = AdminUser(
        email="admin@example.org",
        password_hash=hash_password("a-long-test-password"),
    )
    db_session.add(admin)
    db_session.flush()

    token = "expired-session-token"
    db_session.add(
        AdminSession(
            admin_id=admin.id,
            token_hash=hash_session_token(token),
            expires_at=datetime.now(UTC) - timedelta(minutes=1),
        )
    )
    db_session.commit()

    client.cookies.set("tareka_session", token)
    response = client.get("/api/admin/me")
    assert response.status_code == 401


def test_cors_preflight_allows_patch(client):
    origin = browser_origin()
    response = client.options(
        "/api/admin/businesses/1/services",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "PATCH",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == origin
    allow_methods = response.headers.get("access-control-allow-methods", "")
    assert "PATCH" in allow_methods.upper()


def test_api_documentation_disabled_in_production():
    assert api_documentation_enabled("development") is True
    assert api_documentation_enabled("production") is False


def test_trusted_origins_use_exact_matching():
    settings = Settings(
        database_url="postgresql+psycopg://user:pass@localhost/db",
        environment="development",
        frontend_origin="http://localhost:3000",
        cors_origins="https://tareka.directory",
    )
    allowed = trusted_browser_origins(settings)
    assert origin_is_trusted("http://localhost:3000", allowed)
    assert origin_is_trusted("https://tareka.directory", allowed)
    assert not origin_is_trusted("https://evil.tareka.directory", allowed)
    assert not origin_is_trusted("http://localhost:3000.evil.example", allowed)
