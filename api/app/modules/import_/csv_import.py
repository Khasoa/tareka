import csv
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.directory.constants import BUSINESS_TYPES, COUNTIES, DROPOFF_OPTIONS
from app.modules.directory.models import Business, BusinessMaterial, Location, Material


def import_businesses(db: Session, csv_path: Path) -> int:
    imported = 0

    with csv_path.open("r", encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file)

        for row in reader:
            business_type = row["business_type"].strip()
            dropoff = row["accepts_public_dropoff"].strip()
            county = row["county"].strip()

            if business_type not in BUSINESS_TYPES:
                raise ValueError(f"Invalid business type: {business_type}")
            if dropoff not in DROPOFF_OPTIONS:
                raise ValueError(f"Invalid drop-off value: {dropoff}")
            if county not in COUNTIES:
                raise ValueError(f"Unknown county: {county}")

            slug = row["slug"].strip()
            if db.scalar(select(Business).where(Business.slug == slug)) is not None:
                continue

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

            for material_slug in row["materials"].split("|"):
                material_slug = material_slug.strip()
                if not material_slug:
                    continue
                material = db.scalar(select(Material).where(Material.slug == material_slug))
                if material is None:
                    raise ValueError(f"Unknown material: {material_slug}")
                db.add(BusinessMaterial(business_id=business.id, material_id=material.id))

            imported += 1

    db.commit()
    return imported