from app.modules.directory.models import (
    Business,
    BusinessMaterial,
    Location,
    Material,
)


def test_list_businesses(client, db_session):
    plastic = Material(name="Plastic", slug="plastic")

    business = Business(
        name="Green Test Recycler",
        slug="green-test-recycler",
        business_type="recycler",
        accepts_public_dropoff="yes",
        description="Test recycling business.",
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
    )

    db_session.add(business)
    db_session.commit()

    response = client.get(
        "/businesses/test-upcycler-kenya"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == "Test Upcycler Kenya"
    assert data["business_type"] == "upcycler"


def test_get_missing_business_returns_404(client):
    response = client.get(
        "/businesses/does-not-exist"
    )

    assert response.status_code == 404

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
            ),
            Business(
                name="Test Collector",
                slug="test-collector",
                business_type="collector",
                accepts_public_dropoff="no",
            ),
        ]
    )

    db_session.commit()

    response = client.get(
        "/businesses?business_type=collector"
    )

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
            ),
            Business(
                name="No Dropoff Business",
                slug="no-dropoff-business",
                business_type="collector",
                accepts_public_dropoff="no",
            ),
        ]
    )

    db_session.commit()

    response = client.get(
        "/businesses?accepts_public_dropoff=yes"
    )

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
    )

    business.materials.append(
        BusinessMaterial(material=plastic)
    )

    db_session.add(business)
    db_session.commit()

    response = client.get(
        f"/businesses?material_id={plastic.id}"
    )

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
        )
        for number in range(1, 6)
    ]

    db_session.add_all(businesses)
    db_session.commit()

    response = client.get(
        "/businesses?page=1&page_size=2"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 5
    assert data["page"] == 1
    assert data["page_size"] == 2
    assert data["total_pages"] == 3
    assert len(data["items"]) == 2