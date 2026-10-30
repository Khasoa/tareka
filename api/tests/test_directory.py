from datetime import UTC, datetime, timedelta

from app.modules.directory.models import (
    Business,
    BusinessMaterial,
    Location,
    Material,
)
from tests.conftest import make_business


def _recent_verification() -> datetime:
    return datetime.now(UTC)


def test_list_businesses(client, db_session):
    plastic = Material(name="Plastic", slug="plastic")

    business = make_business(
        "recycler",
        name="Green Test Recycler",
        slug="green-test-recycler",
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
    assert data["items"][0]["business_types"] == ["recycler"]
    assert [item["slug"] for item in data["items"][0]["materials"]] == ["plastic"]


def test_list_businesses_includes_all_linked_materials(client, db_session):
    plastic = Material(name="Plastic", slug="plastic")
    glass = Material(name="Glass", slug="glass")
    paper = Material(name="Paper", slug="paper")
    metal = Material(name="Metal", slug="metal")

    business = make_business(
        "recycler",
        name="Multi Material Recycler",
        slug="multi-material-recycler",
        accepts_public_dropoff="yes",
        verification_status="verified",
        last_verified_at=_recent_verification(),
    )
    for material in (plastic, glass, paper, metal):
        business.materials.append(BusinessMaterial(material=material))
    business.locations.append(Location(county="Nairobi", town="Westlands"))

    db_session.add(business)
    db_session.commit()

    response = client.get("/businesses")
    assert response.status_code == 200
    item = response.json()["items"][0]
    assert [material["slug"] for material in item["materials"]] == [
        "plastic",
        "glass",
        "paper",
        "metal",
    ]


def test_list_businesses_omits_materials_when_none(client, db_session):
    business = make_business(
        "recycler",
        name="No Materials Recycler",
        slug="no-materials-recycler",
        accepts_public_dropoff="yes",
        verification_status="verified",
        last_verified_at=_recent_verification(),
    )
    db_session.add(business)
    db_session.commit()

    response = client.get("/businesses")
    assert response.status_code == 200
    assert response.json()["items"][0]["materials"] == []


def test_get_business_by_slug(client, db_session):
    business = make_business(
        "upcycler",
        name="Test Upcycler Kenya",
        slug="test-upcycler-kenya",
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
    assert data["business_types"] == ["upcycler"]
    assert data["last_verified_at"] is not None


def test_get_missing_business_returns_404(client):
    response = client.get("/businesses/does-not-exist")

    assert response.status_code == 404


def test_unverified_business_not_publicly_visible(client, db_session):
    business = make_business(
        "recycler",
        name="Pending Business",
        slug="pending-business",
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
    business = make_business(
        "recycler",
        name="Expired Business",
        slug="expired-business",
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
    business = make_business(
        "recycler",
        name="Missing Timestamp Business",
        slug="missing-timestamp-business",
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


def test_zero_type_business_not_publicly_visible(client, db_session):
    business = Business(
        name="Unresolved Business",
        slug="unresolved-business",
        business_type="mixed",
        accepts_public_dropoff="yes",
        verification_status="verified",
        last_verified_at=_recent_verification(),
    )
    db_session.add(business)
    db_session.commit()

    assert client.get("/businesses").json()["total"] == 0
    assert client.get("/businesses/unresolved-business").status_code == 404


def test_filter_businesses_by_business_type(
    client,
    db_session,
):
    recycler = make_business(
        "recycler",
        name="Test Recycler",
        slug="test-recycler",
        accepts_public_dropoff="yes",
        verification_status="verified",
        last_verified_at=_recent_verification(),
    )
    collector = make_business(
        "collector",
        name="Test Collector",
        slug="test-collector",
        accepts_public_dropoff="no",
        verification_status="verified",
        last_verified_at=_recent_verification(),
    )
    db_session.add_all([recycler, collector])

    db_session.commit()

    response = client.get("/businesses?business_type=collector")

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 1
    assert data["items"][0]["business_types"] == ["collector"]


def test_filter_businesses_by_dropoff(
    client,
    db_session,
):
    dropoff_business = make_business(
        "recycler",
        name="Dropoff Business",
        slug="dropoff-business",
        accepts_public_dropoff="yes",
        verification_status="verified",
        last_verified_at=_recent_verification(),
    )
    no_dropoff = make_business(
        "collector",
        name="No Dropoff Business",
        slug="no-dropoff-business",
        accepts_public_dropoff="no",
        verification_status="verified",
        last_verified_at=_recent_verification(),
    )
    db_session.add_all([dropoff_business, no_dropoff])

    db_session.commit()

    response = client.get("/businesses?accepts_public_dropoff=yes")

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 1
    assert data["items"][0]["name"] == "Dropoff Business"


def test_filter_businesses_by_pickup(client, db_session):
    pickup_business = make_business(
        "collector",
        name="Pickup Business",
        slug="pickup-business",
        accepts_public_dropoff="unknown",
        offers_pickup="yes",
        verification_status="verified",
        last_verified_at=_recent_verification(),
    )
    other = make_business(
        "collector",
        name="No Pickup Business",
        slug="no-pickup-business",
        offers_pickup="no",
        verification_status="verified",
        last_verified_at=_recent_verification(),
    )
    db_session.add_all([pickup_business, other])
    db_session.commit()

    response = client.get("/businesses?offers_pickup=yes")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["slug"] == "pickup-business"


def test_rejects_mixed_business_type_filter(client):
    response = client.get("/businesses?business_type=mixed")
    assert response.status_code == 422


def test_rejects_invalid_business_type_filter(client):
    response = client.get("/businesses?business_type=not-a-type")
    assert response.status_code == 422


def test_multi_type_business_filter_and_response(client, db_session):
    business = make_business(
        "collector",
        "aggregator",
        name="Multi Type Hub",
        slug="multi-type-hub",
        verification_status="verified",
        last_verified_at=_recent_verification(),
    )
    db_session.add(business)
    db_session.commit()

    by_collector = client.get("/businesses?business_type=collector").json()
    by_aggregator = client.get("/businesses?business_type=aggregator").json()
    assert by_collector["total"] == 1
    assert by_aggregator["total"] == 1
    assert by_collector["items"][0]["business_types"] == [
        "collector",
        "aggregator",
    ]


def test_filter_businesses_by_material(
    client,
    db_session,
):
    plastic = Material(
        name="Plastic",
        slug="plastic",
    )

    business = make_business(
        "recycler",
        name="Plastic Recycler",
        slug="plastic-recycler",
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
        make_business(
            "recycler",
            name=f"Test Business {number}",
            slug=f"test-business-{number}",
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
    current = make_business(
        "recycler",
        name="Current Business",
        slug="current-business",
        accepts_public_dropoff="yes",
        verification_status="verified",
        last_verified_at=_recent_verification(),
    )
    expired = make_business(
        "recycler",
        name="Expired Business",
        slug="expired-business-pagination",
        accepts_public_dropoff="yes",
        verification_status="verified",
        last_verified_at=datetime.now(UTC) - timedelta(days=366),
    )
    db_session.add_all([current, expired])
    db_session.commit()

    response = client.get("/businesses?page=1&page_size=1")

    assert response.status_code == 200

    data = response.json()
    assert data["total"] == 1
    assert data["total_pages"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["name"] == "Current Business"
