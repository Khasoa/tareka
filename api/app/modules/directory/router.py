from math import ceil

from fastapi import APIRouter, HTTPException, Query

from app.core.deps import DbSession
from app.modules.directory import service
from app.modules.directory.models import Business
from app.modules.directory.schemas import (
    BusinessListItem,
    BusinessListResponse,
    BusinessResponse,
)

router = APIRouter(prefix="/businesses", tags=["businesses"])


@router.get("", response_model=BusinessListResponse)
def get_businesses(
    db: DbSession,
    q: str | None = Query(default=None, min_length=1, max_length=100),
    county: str | None = None,
    material_id: int | None = None,
    business_type: str | None = Query(
        default=None, pattern="^(recycler|upcycler|collector|mixed)$"
    ),
    accepts_public_dropoff: str | None = Query(
        default=None, pattern="^(yes|no|unknown)$"
    ),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
):
    businesses, total = service.list_businesses(
        db,
        q=q,
        county=county,
        material_id=material_id,
        business_type=business_type,
        accepts_public_dropoff=accepts_public_dropoff,
        page=page,
        page_size=page_size,
    )
    return {
        "items": [_list_item(business) for business in businesses],
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": ceil(total / page_size) if total else 0,
    }


def _list_item(business: Business) -> BusinessListItem:
    return BusinessListItem(
        id=business.id,
        name=business.name,
        slug=business.slug,
        business_type=business.business_type,
        accepts_public_dropoff=business.accepts_public_dropoff,
        verification_status=business.verification_status,
        last_verified_at=business.last_verified_at,
        locations=business.locations,
        materials=[bm.material for bm in business.materials],
    )


@router.get("/{slug}", response_model=BusinessResponse)
def get_business(slug: str, db: DbSession):
    business = service.get_business_by_slug(db, slug)
    if business is None:
        raise HTTPException(status_code=404, detail="Business not found")

    # business.materials is a list of BusinessMaterial join rows (business_id,
    # material_id) — not the Material itself. Unwrap each one via .material
    # to get the id/name/slug that BusinessResponse actually expects.
    return BusinessResponse(
        id=business.id,
        name=business.name,
        slug=business.slug,
        business_type=business.business_type,
        accepts_public_dropoff=business.accepts_public_dropoff,
        verification_status=business.verification_status,
        last_verified_at=business.last_verified_at,
        description=business.description,
        website_url=business.website_url,
        phone=business.phone,
        email=business.email,
        image_url=business.image_url,
        image_alt=business.image_alt,
        locations=business.locations,
        materials=[bm.material for bm in business.materials],
        created_at=business.created_at,
        updated_at=business.updated_at,
    )
