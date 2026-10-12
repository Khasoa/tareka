from datetime import UTC, datetime, timedelta

from app.modules.directory.models import (
    Business,
    BusinessMaterial,
    Location,
    Material,
)


def _recent_verification() -> datetime:
    return datetime.now(UTC)


def test_list_businesses(client, db_session):
    plastic = Material(name="Plastic", slug="plastic")

    business = Business(
        name="Green Test Recycler",
        slug="green-test-recycler",
        business_type="recycler",
        accepts_public_dropoff="yes",
        description="Test recycling business.",
        verification_status="verified",
        last_verified_at=_recent_verification(),
    )
    business.materials.append(BusinessMaterial(material=plastic))
    business.locations.append(Location(county="Nairobi", town="Nairobi"))

    db_session.add(business)
    db_session.commit()

    response = client.get("/businesses")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == "Green Test Recycler"
    assert data["items"][0]["business_type"] == "recycler"


def test_get_business_by_slug(client, db_session):
    business = Business(
        name="Test Upcycler Kenya",
        slug="test-upcycler-kenya",
        business_type="upcycler",
        accepts_public_dropoff="no",
        verification_status="verified",
        last_verified_at=_recent_verification(),
    )

    db_session.add(business)
    db_session.commit()

    response = client.get("/businesses/test-upcycler-kenya")

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == "Test Upcycler Kenya"
    assert data["business_type"] == "upcycler"


def test_get_missing_business_returns_404(client):
    response = client.get("/businesses/does-not-exist")

    assert response.status_code == 404


def test_unverified_business_not_publicly_visible(client, db_session):
    business = Business(
        name="Pending Business",
        slug="pending-business",
        business_type="recycler",
        accepts_public_dropoff="unknown",
        verification_status="unverified",
    )
    db_session.add(business)
    db_session.commit()

    list_response = client.get("/businesses")
    assert list_response.json()["total"] == 0

    detail_response = client.get("/businesses/pending-business")
    assert detail_response.status_code == 404


def test_expired_business_not_publicly_visible(client, db_session):
    business = Business(
        name="Expired Business",
        slug="expired-business",
        business_type="recycler",
        accepts_public_dropoff="yes",
        verification_status="verified",
        last_verified_at=datetime.now(UTC) - timedelta(days=366),
    )
    db_session.add(business)
    db_session.commit()

    list_response = client.get("/businesses")
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 0
    assert list_response.json()["items"] == []

    detail_response = client.get("/businesses/expired-business")
    assert detail_response.status_code == 404


def test_verified_business_without_verification_timestamp_is_hidden(client, db_session):
    business = Business(
        name="Missing Timestamp Business",
        slug="missing-timestamp-business",
        business_type="recycler",
        accepts_public_dropoff="yes",
        verification_status="verified",
        last_verified_at=None,
    )
    db_session.add(business)
    db_session.commit()

    list_response = client.get("/businesses")
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 0

    detail_response = client.get("/businesses/missing-timestamp-business")
    assert detail_response.status_code == 404


def test_filter_businesses_by_business_type(
    client,
    db_session,
):
    db_session.add_all(
        [
            Business(
                name="Test Recycler",
                slug="test-recycler",
                business_type="recycler",
                accepts_public_dropoff="yes",
                verification_status="verified",
                last_verified_at=_recent_verification(),
            ),
            Business(
                name="Test Collector",
                slug="test-collector",
                business_type="collector",
                accepts_public_dropoff="no",
                verification_status="verified",
                last_verified_at=_recent_verification(),
            ),
        ]
    )

    db_session.commit()

    response = client.get("/businesses?business_type=collector")

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 1
    assert data["items"][0]["business_type"] == "collector"


def test_filter_businesses_by_dropoff(
    client,
    db_session,
):
    db_session.add_all(
        [
            Business(
                name="Dropoff Business",
                slug="dropoff-business",
                business_type="recycler",
                accepts_public_dropoff="yes",
                verification_status="verified",
                last_verified_at=_recent_verification(),
            ),
            Business(
                name="No Dropoff Business",
                slug="no-dropoff-business",
                business_type="collector",
                accepts_public_dropoff="no",
                verification_status="verified",
                last_verified_at=_recent_verification(),
            ),
        ]
    )

    db_session.commit()

    response = client.get("/businesses?accepts_public_dropoff=yes")

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 1
    assert data["items"][0]["name"] == "Dropoff Business"


def test_filter_businesses_by_material(
    client,
    db_session,
):
    plastic = Material(
        name="Plastic",
        slug="plastic",
    )

    business = Business(
        name="Plastic Recycler",
        slug="plastic-recycler",
        business_type="recycler",
        accepts_public_dropoff="yes",
        verification_status="verified",
        last_verified_at=_recent_verification(),
    )

    business.materials.append(BusinessMaterial(material=plastic))

    db_session.add(business)
    db_session.commit()

    response = client.get(f"/businesses?material_id={plastic.id}")

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 1
    assert data["items"][0]["name"] == "Plastic Recycler"


def test_business_pagination(client, db_session):
    businesses = [
        Business(
            name=f"Test Business {number}",
            slug=f"test-business-{number}",
            business_type="recycler",
            accepts_public_dropoff="unknown",
            verification_status="verified",
            last_verified_at=_recent_verification(),
        )
        for number in range(1, 6)
    ]

    db_session.add_all(businesses)
    db_session.commit()

    response = client.get("/businesses?page=1&page_size=2")

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 5
    assert data["page"] == 1
    assert data["page_size"] == 2
    assert data["total_pages"] == 3
    assert len(data["items"]) == 2


def test_pagination_total_excludes_expired_businesses(client, db_session):
    db_session.add_all(
        [
            Business(
                name="Current Business",
                slug="current-business",
                business_type="recycler",
                accepts_public_dropoff="yes",
                verification_status="verified",
                last_verified_at=_recent_verification(),
            ),
            Business(
                name="Expired Business",
                slug="expired-business-pagination",
                business_type="recycler",
                accepts_public_dropoff="yes",
                verification_status="verified",
                last_verified_at=datetime.now(UTC) - timedelta(days=366),
            ),
        ]
    )
    db_session.commit()

    response = client.get("/businesses?page=1&page_size=1")

    assert response.status_code == 200

    data = response.json()
    assert data["total"] == 1
    assert data["total_pages"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["name"] == "Current Business"
