from app.modules.directory.constants import (
    BUSINESS_TYPE_SET,
    sort_business_types,
    validate_business_types,
)
from app.modules.directory.models import Business, BusinessBusinessType


def business_type_values(business: Business) -> list[str]:
    if business.business_type_links:
        return sort_business_types(
            [link.business_type for link in business.business_type_links]
        )
    legacy = (business.business_type or "").strip().lower()
    if legacy and legacy in BUSINESS_TYPE_SET:
        return [legacy]
    return []


def replace_business_types(db, business: Business, types: list[str]) -> None:
    validated = validate_business_types(types)
    business.business_type_links.clear()
    for business_type in validated:
        business.business_type_links.append(
            BusinessBusinessType(business_type=business_type)
        )
