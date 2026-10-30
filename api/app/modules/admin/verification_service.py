from datetime import UTC, datetime, timedelta
from math import ceil

from sqlalchemy import case, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.modules.directory.constants import (
    BUSINESS_TYPE_SET,
    COUNTIES,
    LEGACY_BUSINESS_TYPE_MIXED,
    VERIFICATION_STATUSES,
)
from app.modules.directory.models import (
    Business,
    BusinessBusinessType,
    BusinessMaterial,
    Location,
)
from app.modules.directory.service import VERIFICATION_MAX_AGE_DAYS
from app.modules.directory.type_utils import business_type_values


def verification_cutoff() -> datetime:
    return datetime.now(UTC) - timedelta(days=VERIFICATION_MAX_AGE_DAYS)


def needs_verification_condition():
    cutoff = verification_cutoff()
    return (
        Business.is_active.is_(True),
        or_(
            Business.verification_status != "verified",
            Business.last_verified_at.is_(None),
            Business.last_verified_at < cutoff,
        ),
    )


def _status_sort_key():
    return case(
        (Business.verification_status == "unverified", 0),
        (Business.verification_status == "needs_review", 1),
        else_=2,
    )


def _business_list_options():
    return (
        selectinload(Business.locations),
        selectinload(Business.materials).selectinload(BusinessMaterial.material),
        selectinload(Business.business_type_links),
    )


def count_businesses_needing_verification(db: Session) -> int:
    conditions = needs_verification_condition()
    return db.scalar(select(func.count()).select_from(Business).where(*conditions)) or 0


def list_businesses_needing_verification(
    db: Session,
    *,
    q: str | None = None,
    county: str | None = None,
    business_type: str | None = None,
    verification_status: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Business], int]:
    if page_size < 1 or page_size > 50:
        raise ValueError("page_size must be between 1 and 50")

    if business_type is not None:
        if business_type == LEGACY_BUSINESS_TYPE_MIXED:
            pass  # filter legacy column below
        elif business_type not in BUSINESS_TYPE_SET:
            raise ValueError("Invalid business type.")

    if (
        verification_status is not None
        and verification_status not in VERIFICATION_STATUSES
    ):
        raise ValueError("Invalid verification status.")

    if county is not None and county not in COUNTIES:
        raise ValueError("Invalid county.")

    conditions = list(needs_verification_condition())
    query = select(Business).options(*_business_list_options()).where(*conditions)
    count_query = (
        select(func.count(func.distinct(Business.id)))
        .select_from(Business)
        .where(*conditions)
    )

    if q:
        pattern = f"%{q.strip()}%"
        name_filter = Business.name.ilike(pattern)
        query = query.where(name_filter)
        count_query = count_query.where(name_filter)

    if county:
        query = query.join(Business.locations).where(Location.county == county)
        count_query = count_query.join(Business.locations).where(
            Location.county == county
        )

    if business_type:
        if business_type == LEGACY_BUSINESS_TYPE_MIXED:
            legacy_filter = or_(
                Business.business_type == LEGACY_BUSINESS_TYPE_MIXED,
                ~Business.business_type_links.any(),
            )
            query = query.where(legacy_filter)
            count_query = count_query.where(legacy_filter)
        else:
            type_filter = Business.business_type_links.any(
                BusinessBusinessType.business_type == business_type
            )
            query = query.where(type_filter)
            count_query = count_query.where(type_filter)

    if verification_status:
        query = query.where(Business.verification_status == verification_status)
        count_query = count_query.where(
            Business.verification_status == verification_status
        )

    query = query.order_by(
        _status_sort_key(),
        Business.last_verified_at.asc().nulls_first(),
        Business.name.asc(),
    )

    offset = (page - 1) * page_size
    businesses = db.scalars(query.offset(offset).limit(page_size)).unique().all()
    total = db.scalar(count_query) or 0

    return list(businesses), total


def get_admin_business(db: Session, business_id: int) -> Business | None:
    return db.scalars(
        select(Business)
        .options(
            *_business_list_options(),
            selectinload(Business.verification_records),
        )
        .where(Business.id == business_id)
    ).first()


def business_is_currently_verified(business: Business) -> bool:
    if business.verification_status != "verified":
        return False
    if business.last_verified_at is None:
        return False
    last_verified = business.last_verified_at
    if last_verified.tzinfo is None:
        last_verified = last_verified.replace(tzinfo=UTC)
    return last_verified >= verification_cutoff()


def _types_unresolved(business: Business) -> bool:
    if business_type_values(business):
        return False
    legacy = (business.business_type or "").strip().lower()
    return legacy == LEGACY_BUSINESS_TYPE_MIXED or not legacy


def serialize_business_summary(business: Business) -> dict[str, object]:
    location = business.locations[0] if business.locations else None
    types = business_type_values(business)
    return {
        "id": business.id,
        "name": business.name,
        "slug": business.slug,
        "business_types": types,
        "legacy_business_type": business.business_type,
        "types_unresolved": _types_unresolved(business),
        "accepts_public_dropoff": business.accepts_public_dropoff,
        "offers_pickup": business.offers_pickup,
        "verification_status": business.verification_status,
        "last_verified_at": business.last_verified_at,
        "website_url": business.website_url,
        "phone": business.phone,
        "source_url": business.source_url,
        "county": location.county if location else None,
        "town": location.town if location else None,
        "materials": [
            {
                "id": bm.material.id,
                "name": bm.material.name,
                "slug": bm.material.slug,
            }
            for bm in business.materials
        ],
    }


def serialize_business_detail(business: Business) -> dict[str, object]:
    summary = serialize_business_summary(business)
    summary.update(
        {
            "description": business.description,
            "email": business.email,
            "source_type": business.source_type,
            "is_active": business.is_active,
            "locations": [
                {
                    "county": loc.county,
                    "town": loc.town,
                    "address": loc.address,
                }
                for loc in business.locations
            ],
            "verification_records": [
                {
                    "id": record.id,
                    "status": record.status,
                    "verified_at": record.verified_at,
                    "source_type": record.source_type,
                    "source_url": record.source_url,
                    "notes": record.notes,
                }
                for record in sorted(
                    business.verification_records,
                    key=lambda item: item.verified_at,
                    reverse=True,
                )
            ],
        }
    )
    return summary


def paginated_response(
    items: list[dict[str, object]],
    *,
    page: int,
    page_size: int,
    total: int,
) -> dict[str, object]:
    total_pages = ceil(total / page_size) if total else 0
    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
    }
