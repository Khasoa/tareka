from datetime import UTC, datetime, timedelta

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.modules.directory.models import Business, BusinessMaterial, Location, Material

VERIFICATION_MAX_AGE_DAYS = 365


def _verification_cutoff() -> datetime:
    return datetime.now(UTC) - timedelta(days=VERIFICATION_MAX_AGE_DAYS)


def list_businesses(
    db: Session,
    *,
    q: str | None = None,
    county: str | None = None,
    material_id: int | None = None,
    business_type: str | None = None,
    accepts_public_dropoff: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Business], int]:
    cutoff = _verification_cutoff()

    query = (
        select(Business)
        .options(
            selectinload(Business.locations),
            selectinload(Business.materials).selectinload(BusinessMaterial.material),
        )
        .where(
            Business.is_active.is_(True),
            Business.verification_status == "verified",
            Business.last_verified_at.is_not(None),
            Business.last_verified_at >= cutoff,
        )
    )

    count_query = (
        select(func.count(func.distinct(Business.id)))
        .select_from(Business)
        .where(
            Business.is_active.is_(True),
            Business.verification_status == "verified",
            Business.last_verified_at.is_not(None),
            Business.last_verified_at >= cutoff,
        )
    )

    if q:
        pattern = f"%{q.strip()}%"
        search_filter = or_(
            Business.name.ilike(pattern),
            Business.locations.any(Location.county.ilike(pattern)),
            Business.locations.any(Location.town.ilike(pattern)),
            Business.materials.any(
                BusinessMaterial.material.has(Material.name.ilike(pattern))
            ),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    if county:
        query = query.join(Business.locations).where(Location.county == county)
        count_query = count_query.join(Business.locations).where(
            Location.county == county
        )

    if material_id:
        query = query.join(Business.materials).where(
            BusinessMaterial.material_id == material_id
        )
        count_query = count_query.join(Business.materials).where(
            BusinessMaterial.material_id == material_id
        )

    if business_type:
        query = query.where(Business.business_type == business_type)
        count_query = count_query.where(Business.business_type == business_type)

    if accepts_public_dropoff:
        query = query.where(Business.accepts_public_dropoff == accepts_public_dropoff)
        count_query = count_query.where(
            Business.accepts_public_dropoff == accepts_public_dropoff
        )

    # Every result is verified and within the annual verification period.
    query = query.order_by(Business.name)

    offset = (page - 1) * page_size
    businesses = db.scalars(query.offset(offset).limit(page_size)).unique().all()
    total = db.scalar(count_query) or 0

    return list(businesses), total


def get_business_by_slug(db: Session, slug: str) -> Business | None:
    query = (
        select(Business)
        .options(
            selectinload(Business.locations),
            selectinload(Business.materials).selectinload(BusinessMaterial.material),
            selectinload(Business.verification_records),
        )
        .where(
            Business.slug == slug,
            Business.is_active.is_(True),
            Business.verification_status == "verified",
            Business.last_verified_at.is_not(None),
            Business.last_verified_at >= _verification_cutoff(),
        )
    )

    return db.scalars(query).unique().first()


def list_materials(db: Session) -> list[Material]:
    return list(db.scalars(select(Material).order_by(Material.name)).all())


def list_counties(db: Session) -> list[str]:
    return list(
        db.scalars(select(Location.county).distinct().order_by(Location.county)).all()
    )
