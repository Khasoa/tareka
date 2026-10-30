import pytest
from sqlalchemy import select

from app.modules.directory.constants import sort_business_types
from app.modules.directory.models import (
    Business,
    BusinessBusinessType,
    BusinessMaterial,
    Location,
    Material,
    VerificationRecord,
)
from app.modules.import_.csv_import import import_businesses


def test_import_businesses_starts_unverified(
    db_session,
    tmp_path,
):
    plastic = Material(
        name="Plastic",
        slug="plastic",
    )
    db_session.add(plastic)
    db_session.commit()

    csv_file = tmp_path / "businesses.csv"

    csv_file.write_text(
        (
            "name,slug,business_types,"
            "accepts_public_dropoff,county,town,"
            "materials\n"
            "CSV Recycler,csv-recycler,recycler,"
            "yes,Nairobi,Nairobi,plastic\n"
        ),
        encoding="utf-8",
    )

    imported, errors = import_businesses(db_session, csv_file)

    assert imported == 1
    assert errors == []

    business = db_session.scalar(
        select(Business).where(Business.slug == "csv-recycler")
    )

    assert business is not None
    assert business.name == "CSV Recycler"
    assert business.verification_status == "unverified"
    assert business.last_verified_at is None
    assert business.offers_pickup == "unknown"

    types = db_session.scalars(
        select(BusinessBusinessType.business_type).where(
            BusinessBusinessType.business_id == business.id
        )
    ).all()
    assert types == ["recycler"]

    location = db_session.scalar(
        select(Location).where(Location.business_id == business.id)
    )

    assert location is not None
    assert location.county == "Nairobi"
    assert location.town == "Nairobi"

    business_material = db_session.scalar(
        select(BusinessMaterial).where(
            BusinessMaterial.business_id == business.id,
            BusinessMaterial.material_id == plastic.id,
        )
    )

    assert business_material is not None

    verification_records = db_session.scalars(
        select(VerificationRecord).where(VerificationRecord.business_id == business.id)
    ).all()

    assert verification_records == []


def test_import_legacy_business_type_header(db_session, tmp_path):
    plastic = Material(name="Plastic", slug="plastic")
    db_session.add(plastic)
    db_session.commit()

    csv_file = tmp_path / "businesses.csv"
    csv_file.write_text(
        "name,slug,business_type,accepts_public_dropoff,county,materials\n"
        "Legacy Row,legacy-row,collector,yes,Nairobi,plastic\n",
        encoding="utf-8",
    )

    imported, errors = import_businesses(db_session, csv_file)
    assert imported == 1
    assert errors == []


def test_import_rejects_both_type_headers(db_session, tmp_path):
    csv_file = tmp_path / "businesses.csv"
    csv_file.write_text(
        "name,slug,business_type,business_types,accepts_public_dropoff,county,materials\n"
        "Bad Row,bad-row,recycler,recycler,yes,Nairobi,plastic\n",
        encoding="utf-8",
    )

    with pytest.raises(ValueError, match="must not include both"):
        import_businesses(db_session, csv_file)


def test_import_rejects_mixed(db_session, tmp_path):
    csv_file = tmp_path / "businesses.csv"
    csv_file.write_text(
        "name,slug,business_types,accepts_public_dropoff,county,materials\n"
        "Mixed Row,mixed-row,mixed,yes,Nairobi,plastic\n",
        encoding="utf-8",
    )

    imported, errors = import_businesses(db_session, csv_file)
    assert imported == 0
    assert len(errors) == 1
    assert "mixed" in errors[0].lower()


def test_import_pipe_separated_types(db_session, tmp_path):
    plastic = Material(name="Plastic", slug="plastic")
    db_session.add(plastic)
    db_session.commit()

    csv_file = tmp_path / "businesses.csv"
    csv_file.write_text(
        "name,slug,business_types,accepts_public_dropoff,offers_pickup,county,materials\n"
        "Hub Row,hub-row,collector|aggregator,yes,no,Nairobi,plastic\n",
        encoding="utf-8",
    )

    imported, errors = import_businesses(db_session, csv_file)
    assert imported == 1
    assert errors == []

    business = db_session.scalar(select(Business).where(Business.slug == "hub-row"))
    assert business is not None
    assert business.offers_pickup == "no"
    types = db_session.scalars(
        select(BusinessBusinessType.business_type)
        .where(BusinessBusinessType.business_id == business.id)
        .order_by(BusinessBusinessType.business_type)
    ).all()
    assert sort_business_types(list(types)) == ["collector", "aggregator"]
