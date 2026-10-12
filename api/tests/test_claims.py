from app.modules.admin.models import AdminUser
from app.modules.admin.security import hash_password
from app.modules.claims.models import BusinessClaim
from app.modules.directory.models import Business

TEST_ADMIN_EMAIL = "claims-admin@example.org"
TEST_ADMIN_PASSWORD = "a-long-test-password"


def create_business(
    db_session,
    *,
    name="Test Recycler",
    slug="test-recycler",
    verification_status="verified",
    content_use_consent=False,
    image_consent=False,
    is_active=True,
):
    business = Business(
        name=name,
        slug=slug,
        business_type="recycler",
        accepts_public_dropoff="yes",
        verification_status=verification_status,
        content_use_consent=content_use_consent,
        image_consent=image_consent,
        is_active=is_active,
        source_url="https://example.org/recycler",
    )
    db_session.add(business)
    db_session.commit()
    return business


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


def create_claim(
    db_session,
    business,
    *,
    correction_note=None,
    content_use_consent=False,
    image_consent=False,
):
    claim = BusinessClaim(
        business_id=business.id,
        claimant_name="Test Claimant",
        claimant_role="Owner",
        claimant_contact="owner@example.org",
        correction_note=correction_note,
        content_use_consent=content_use_consent,
        image_consent=image_consent,
        status="pending",
    )
    db_session.add(claim)
    db_session.commit()
    return claim


def test_claim_can_be_submitted_without_consent(client, db_session):
    business = create_business(db_session)

    response = client.post(
        f"/api/businesses/{business.id}/claims",
        json={
            "claimant_name": "Test Claimant",
            "claimant_role": "Owner",
            "claimant_contact": "owner@example.org",
        },
    )

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

    claim = db_session.query(BusinessClaim).one()
    assert claim.business_id == business.id
    assert claim.status == "pending"
    assert claim.content_use_consent is False
    assert claim.image_consent is False


def test_claim_can_be_submitted_with_explicit_false_consent(client, db_session):
    business = create_business(db_session)

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
    claim = db_session.query(BusinessClaim).one()
    assert claim.content_use_consent is False
    assert claim.image_consent is False


def test_claim_for_inactive_business_returns_not_found(client, db_session):
    business = create_business(db_session, is_active=False)

    response = client.post(
        f"/api/businesses/{business.id}/claims",
        json={
            "claimant_name": "Test Claimant",
            "claimant_role": "Owner",
            "claimant_contact": "owner@example.org",
        },
    )

    assert response.status_code == 404


def test_approving_correction_claim_does_not_change_verification(client, db_session):
    business = create_business(
        db_session,
        verification_status="verified",
    )
    claim = create_claim(
        db_session,
        business,
        correction_note="Please update our phone number.",
    )
    login_admin(client, db_session)

    response = client.post(f"/api/admin/claims/{claim.id}/approve")

    assert response.status_code == 200
    assert response.json() == {"status": "approved"}

    db_session.refresh(business)
    db_session.refresh(claim)

    assert business.verification_status == "verified"
    assert claim.status == "approved"
    assert claim.reviewed_at is not None
    assert claim.correction_note == "Please update our phone number."


def test_approving_claim_without_correction_does_not_change_verification(
    client, db_session
):
    business = create_business(
        db_session,
        verification_status="unverified",
    )
    claim = create_claim(db_session, business)
    login_admin(client, db_session)

    response = client.post(f"/api/admin/claims/{claim.id}/approve")

    assert response.status_code == 200
    db_session.refresh(business)

    assert business.verification_status == "unverified"


def test_approval_without_claim_consent_preserves_existing_consent(client, db_session):
    business = create_business(
        db_session,
        content_use_consent=True,
        image_consent=True,
    )
    claim = create_claim(
        db_session,
        business,
        content_use_consent=False,
        image_consent=False,
    )
    login_admin(client, db_session)

    response = client.post(f"/api/admin/claims/{claim.id}/approve")

    assert response.status_code == 200
    db_session.refresh(business)

    assert business.content_use_consent is True
    assert business.image_consent is True


def test_approval_applies_consent_granted_on_claim(client, db_session):
    business = create_business(db_session)
    claim = create_claim(
        db_session,
        business,
        content_use_consent=True,
        image_consent=True,
    )
    login_admin(client, db_session)

    response = client.post(f"/api/admin/claims/{claim.id}/approve")

    assert response.status_code == 200
    db_session.refresh(business)

    assert business.content_use_consent is True
    assert business.image_consent is True


def test_admin_claim_list_requires_authentication(client, db_session):
    response = client.get("/api/admin/claims")
    assert response.status_code == 401


def test_approving_nonexistent_claim_returns_404(client, db_session):
    login_admin(client, db_session)

    response = client.post("/api/admin/claims/999999/approve")

    assert response.status_code == 404


def test_claim_cannot_be_approved_twice(client, db_session):
    business = create_business(db_session)
    claim = create_claim(db_session, business)
    login_admin(client, db_session)

    first_response = client.post(f"/api/admin/claims/{claim.id}/approve")
    second_response = client.post(f"/api/admin/claims/{claim.id}/approve")

    assert first_response.status_code == 200
    assert second_response.status_code == 409


def test_rejecting_claim_does_not_change_business_verification(client, db_session):
    business = create_business(
        db_session,
        verification_status="verified",
    )
    claim = create_claim(db_session, business)
    login_admin(client, db_session)

    response = client.post(f"/api/admin/claims/{claim.id}/reject")

    assert response.status_code == 200
    assert response.json() == {"status": "rejected"}

    db_session.refresh(business)
    db_session.refresh(claim)

    assert business.verification_status == "verified"
    assert claim.status == "rejected"
    assert claim.reviewed_at is not None
