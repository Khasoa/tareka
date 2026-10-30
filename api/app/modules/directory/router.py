from math import ceil

from fastapi import APIRouter, HTTPException, Query

from app.core.deps import DbSession
from app.modules.directory import service
from app.modules.directory.constants import (
    BUSINESS_TYPE_SET,
    LEGACY_BUSINESS_TYPE_MIXED,
    SERVICE_AVAILABILITY_OPTIONS,
)
from app.modules.directory.models import Business
from app.modules.directory.schemas import (
    BusinessListItem,
    BusinessListResponse,
    BusinessResponse,
)
from app.modules.directory.type_utils import business_type_values

router = APIRouter(prefix="/businesses", tags=["businesses"])

_BUSINESS_TYPE_PATTERN = "^(" + "|".join(BUSINESS_TYPE_SET) + ")$"
_SERVICE_PATTERN = "^(" + "|".join(SERVICE_AVAILABILITY_OPTIONS) + ")$"


@router.get("", response_model=BusinessListResponse)
def get_businesses(
    db: DbSession,
    q: str | None = Query(default=None, min_length=1, max_length=100),
    county: str | None = None,
    material_id: int | None = None,
    business_type: str | None = Query(default=None, pattern=_BUSINESS_TYPE_PATTERN),
    accepts_public_dropoff: str | None = Query(default=None, pattern=_SERVICE_PATTERN),
    offers_pickup: str | None = Query(default=None, pattern=_SERVICE_PATTERN),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
):
    if business_type == LEGACY_BUSINESS_TYPE_MIXED:
        raise HTTPException(status_code=422, detail="Unsupported business type.")

    businesses, total = service.list_businesses(
        db,
        q=q,
        county=county,
        material_id=material_id,
        business_type=business_type,
        accepts_public_dropoff=accepts_public_dropoff,
        offers_pickup=offers_pickup,
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
        business_types=business_type_values(business),
        accepts_public_dropoff=business.accepts_public_dropoff,
        offers_pickup=business.offers_pickup,
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

    return BusinessResponse(
        id=business.id,
        name=business.name,
        slug=business.slug,
        business_types=business_type_values(business),
        accepts_public_dropoff=business.accepts_public_dropoff,
        offers_pickup=business.offers_pickup,
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
