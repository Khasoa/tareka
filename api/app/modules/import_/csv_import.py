import csv
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.validation import validate_http_url
from app.modules.directory.constants import (
    COUNTIES,
    LEGACY_BUSINESS_TYPE_MIXED,
    validate_business_types,
    validate_service_availability,
)
from app.modules.directory.models import (
    Business,
    BusinessMaterial,
    Location,
    Material,
)
from app.modules.directory.type_utils import replace_business_types


def _parse_pipe_list(raw: str | None) -> list[str]:
    return [item.strip() for item in (raw or "").split("|") if item.strip()]


def import_businesses(db: Session, csv_path: Path) -> tuple[int, list[str]]:
    imported = 0
    errors: list[str] = []

    with csv_path.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)
        fieldnames = set(reader.fieldnames or [])

        has_business_types = "business_types" in fieldnames
        has_legacy_type = "business_type" in fieldnames

        if has_business_types and has_legacy_type:
            raise ValueError(
                "CSV must not include both business_types and business_type columns."
            )

        if not has_business_types and not has_legacy_type:
            raise ValueError(
                "CSV is missing required column: business_types (or legacy business_type)."
            )

        required_columns = {
            "name",
            "slug",
            "accepts_public_dropoff",
            "county",
            "materials",
        }

        missing_columns = required_columns - fieldnames
        if missing_columns:
            raise ValueError(
                "CSV is missing required columns: " + ", ".join(sorted(missing_columns))
            )

        for row_number, row in enumerate(reader, start=2):
            try:
                name = (row.get("name") or "").strip()
                slug = (row.get("slug") or "").strip()
                dropoff_raw = (row.get("accepts_public_dropoff") or "").strip()
                county = (row.get("county") or "").strip()

                if len(name) < 2:
                    raise ValueError("name is required")
                if not slug:
                    raise ValueError("slug is required")

                if has_business_types:
                    type_tokens = _parse_pipe_list(row.get("business_types"))
                    if not type_tokens:
                        raise ValueError("business_types is required")
                    if LEGACY_BUSINESS_TYPE_MIXED in [
                        token.strip().lower() for token in type_tokens
                    ]:
                        raise ValueError("'mixed' is not a supported business type")
                    validated_types = validate_business_types(type_tokens)
                else:
                    legacy = (row.get("business_type") or "").strip().lower()
                    if not legacy:
                        raise ValueError("business_type is required")
                    if legacy == LEGACY_BUSINESS_TYPE_MIXED:
                        raise ValueError("'mixed' is not a supported business type")
                    validated_types = validate_business_types([legacy])

                dropoff = validate_service_availability(
                    dropoff_raw, field="accepts_public_dropoff"
                )

                pickup_raw = (row.get("offers_pickup") or "").strip()
                if pickup_raw:
                    pickup = validate_service_availability(
                        pickup_raw, field="offers_pickup"
                    )
                else:
                    pickup = "unknown"

                if county not in COUNTIES:
                    raise ValueError(f"unknown county '{county}'")

                if db.scalar(select(Business).where(Business.slug == slug)) is not None:
                    raise ValueError(f"duplicate slug '{slug}'")

                website_url = validate_http_url(row.get("website_url"))
                source_url = validate_http_url(row.get("source_url"))

                material_slugs = _parse_pipe_list(row.get("materials"))

                materials = []
                for material_slug in material_slugs:
                    material = db.scalar(
                        select(Material).where(Material.slug == material_slug)
                    )
                    if material is None:
                        raise ValueError(f"unknown material '{material_slug}'")
                    materials.append(material)

                business = Business(
                    name=name,
                    slug=slug,
                    business_type=None,
                    accepts_public_dropoff=dropoff,
                    offers_pickup=pickup,
                    description=(row.get("description") or "").strip() or None,
                    website_url=website_url,
                    phone=(row.get("phone") or "").strip() or None,
                    email=(row.get("email") or "").strip() or None,
                    source_type=(row.get("source_type") or "").strip()
                    or "admin_research",
                    source_url=source_url,
                    verification_status="unverified",
                    last_verified_at=None,
                )

                db.add(business)
                db.flush()
                replace_business_types(db, business, validated_types)

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

                db.commit()
                imported += 1

            except (ValueError, SQLAlchemyError) as exc:
                db.rollback()
                errors.append(f"Row {row_number}: {exc}")

    return imported, errors
