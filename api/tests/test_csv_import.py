from app.modules.directory.models import Material
from app.modules.import_.csv_import import import_businesses


def test_import_businesses(
    db_session,
    tmp_path,
):
    db_session.add(
        Material(
            name="Plastic",
            slug="plastic",
        )
    )

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

    imported = import_businesses(
        db_session,
        csv_file,
    )

    assert imported == 1