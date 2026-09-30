import csv
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.directory.constants import BUSINESS_TYPES, COUNTIES, DROPOFF_OPTIONS
from app.modules.directory.models import Business, BusinessMaterial, Location, Material


def import_businesses(db: Session, csv_path: Path) -> tuple[int, list[str]]:
    imported = 0
    errors: list[str] = []

    with csv_path.open("r", encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file)

        for row_number, row in enumerate(reader, start=2):  # start=2: row 1 is the header
            try:
                business_type = row["business_type"].strip()
                dropoff = row["accepts_public_dropoff"].strip()
                county = row["county"].strip()
                slug = row["slug"].strip()

                if business_type not in BUSINESS_TYPES:
                    raise ValueError(f"invalid business_type '{business_type}'")
                if dropoff not in DROPOFF_OPTIONS:
                    raise ValueError(f"invalid accepts_public_dropoff '{dropoff}'")
                if county not in COUNTIES:
                    raise ValueError(f"unknown county '{county}'")
                if db.scalar(select(Business).where(Business.slug == slug)) is not None:
                    raise ValueError(f"duplicate slug '{slug}'")

                material_slugs = [m.strip() for m in row["materials"].split("|") if m.strip()]
                materials = []
                for material_slug in material_slugs:
                    material = db.scalar(select(Material).where(Material.slug == material_slug))
                    if material is None:
                        raise ValueError(f"unknown material '{material_slug}'")
                    materials.append(material)

                business = Business(
                    name=row["name"].strip(),
                    slug=slug,
                    business_type=business_type,
                    accepts_public_dropoff=dropoff,
                    description=row.get("description") or None,
                    website_url=row.get("website_url") or None,
                    phone=row.get("phone") or None,
                    email=row.get("email") or None,
                    source_type=row.get("source_type") or "admin_research",
                    source_url=row.get("source_url") or None,
                )
                db.add(business)
                db.flush()
                db.add(Location(business_id=business.id, county=county, town=row.get("town") or None))
                for material in materials:
                    db.add(BusinessMaterial(business_id=business.id, material_id=material.id))

                db.commit()  # commit per successful row, not once at the end
                imported += 1

            except ValueError as e:
                db.rollback()
                errors.append(f"row {row_number} ({row.get('name', '?')}): {e}")

    return imported, errors