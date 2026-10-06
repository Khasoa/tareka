from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.modules.directory.models import Business, BusinessMaterial, Location, Material


def list_businesses(
    db: Session,
    *,
    county: str | None = None,
    material_id: int | None = None,
    business_type: str | None = None,
    accepts_public_dropoff: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Business], int]:
    query = (
        select(Business)
        .options(
            selectinload(Business.locations),
            selectinload(Business.materials).selectinload(BusinessMaterial.material),
        )
        .where(Business.is_active.is_(True), Business.verification_status == "verified")
    )
    count_query = (
        select(func.count(func.distinct(Business.id)))
        .select_from(Business)
        .where(Business.is_active.is_(True), Business.verification_status == "verified")
    )

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

    # Alphabetical — every result here is already verified, so this is just
    # a readable tiebreaker, not a trust signal anymore.
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
        )
    )
    return db.scalars(query).unique().first()


def list_materials(db: Session) -> list[Material]:
    return list(db.scalars(select(Material).order_by(Material.name)).all())


def list_counties(db: Session) -> list[str]:
    return list(
        db.scalars(select(Location.county).distinct().order_by(Location.county)).all()
    )
