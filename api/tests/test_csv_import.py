from sqlalchemy import select

from app.modules.directory.models import (
    Business,
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
            "name,slug,business_type,"
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
