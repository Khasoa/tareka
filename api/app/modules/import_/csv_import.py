import csv
from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.validation import validate_http_url
from app.modules.directory.constants import (
    BUSINESS_TYPES,
    COUNTIES,
    DROPOFF_OPTIONS,
)
from app.modules.directory.models import (
    Business,
    BusinessMaterial,
    Location,
    Material,
    VerificationRecord,
)


def import_businesses(db: Session, csv_path: Path) -> tuple[int, list[str]]:
    imported = 0
    errors: list[str] = []

    with csv_path.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)
        required_columns = {
            "name",
            "slug",
            "business_type",
            "accepts_public_dropoff",
            "county",
            "town",
            "materials",
        }

        missing_columns = required_columns - set(reader.fieldnames or [])
        if missing_columns:
            raise ValueError(
                "CSV is missing required columns: " + ", ".join(sorted(missing_columns))
            )

        for row_number, row in enumerate(reader, start=2):
            try:
                name = (row.get("name") or "").strip()
                slug = (row.get("slug") or "").strip()
                business_type = (row.get("business_type") or "").strip()
                dropoff = (row.get("accepts_public_dropoff") or "").strip()
                county = (row.get("county") or "").strip()

                if len(name) < 2:
                    raise ValueError("name is required")
                if not slug:
                    raise ValueError("slug is required")
                if business_type not in BUSINESS_TYPES:
                    raise ValueError(f"invalid business_type '{business_type}'")
                if dropoff not in DROPOFF_OPTIONS:
                    raise ValueError(f"invalid accepts_public_dropoff '{dropoff}'")
                if county not in COUNTIES:
                    raise ValueError(f"unknown county '{county}'")

                if db.scalar(select(Business).where(Business.slug == slug)) is not None:
                    raise ValueError(f"duplicate slug '{slug}'")

                website_url = validate_http_url(row.get("website_url"))
                source_url = validate_http_url(row.get("source_url"))

                material_slugs = [
                    item.strip()
                    for item in (row.get("materials") or "").split("|")
                    if item.strip()
                ]

                materials = []
                for material_slug in material_slugs:
                    material = db.scalar(
                        select(Material).where(Material.slug == material_slug)
                    )
                    if material is None:
                        raise ValueError(f"unknown material '{material_slug}'")
                    materials.append(material)

                now = datetime.now(UTC)
                business = Business(
                    name=name,
                    slug=slug,
                    business_type=business_type,
                    accepts_public_dropoff=dropoff,
                    description=(row.get("description") or "").strip() or None,
                    website_url=website_url,
                    phone=(row.get("phone") or "").strip() or None,
                    email=(row.get("email") or "").strip() or None,
                    source_type=(row.get("source_type") or "").strip()
                    or "admin_research",
                    source_url=source_url,
                    verification_status="verified",
                    last_verified_at=now,
                )

                db.add(business)
                db.flush()

                db.add(
                    Location(
                        business_id=business.id,
                        county=county,
                        town=(row.get("town") or "").strip() or None,
                    )
                )

                for material in materials:
                    db.add(
                        BusinessMaterial(
                            business_id=business.id,
                            material_id=material.id,
                        )
                    )

                db.add(
                    VerificationRecord(
                        business_id=business.id,
                        status="verified",
                        verified_at=now,
                        source_type=business.source_type,
                        source_url=source_url,
                        notes="Imported from an administrator-managed CSV.",
                    )
                )

                db.commit()
                imported += 1

            except (ValueError, KeyError, SQLAlchemyError) as exc:
                db.rollback()
                errors.append(f"row {row_number} ({row.get('name', '?')}): {exc}")

    return imported, errors
