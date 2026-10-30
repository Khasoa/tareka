"""Directory constants and canonical business-type ordering."""

from typing import Final

# Canonical public business types (display order).
CANONICAL_BUSINESS_TYPES: Final[tuple[str, ...]] = (
    "collector",
    "aggregator",
    "recycler",
    "upcycler",
)

BUSINESS_TYPE_SET = frozenset(CANONICAL_BUSINESS_TYPES)

BUSINESS_TYPE_LABELS: Final[dict[str, str]] = {
    "collector": "Collector",
    "aggregator": "Aggregator",
    "recycler": "Recycler",
    "upcycler": "Upcycler",
}

BUSINESS_TYPE_DEFINITIONS: Final[dict[str, str]] = {
    "collector": (
        "Gathers waste or recyclable materials from households, businesses "
        "or other sources."
    ),
    "aggregator": (
        "Consolidates materials collected from multiple sources before onward "
        "transfer, sale, supply or processing. This can include buy-back "
        "centres and scrap dealers where their actual operations support the "
        "classification."
    ),
    "recycler": "Reprocesses waste into raw materials or comparable products.",
    "upcycler": (
        "Turns waste or discarded materials into higher-value goods or design products."
    ),
}

LEGACY_BUSINESS_TYPE_MIXED = "mixed"

# Tri-state service availability (public drop-off and pick-up).
SERVICE_AVAILABILITY_OPTIONS = frozenset({"yes", "no", "unknown"})

# Backward-compatible alias used in existing modules/tests during transition.
DROPOFF_OPTIONS = SERVICE_AVAILABILITY_OPTIONS

VERIFICATION_STATUSES = {"verified", "unverified", "needs_review"}

COUNTIES = {
    "Baringo",
    "Bomet",
    "Bungoma",
    "Busia",
    "Elgeyo-Marakwet",
    "Embu",
    "Garissa",
    "Homa Bay",
    "Isiolo",
    "Kajiado",
    "Kakamega",
    "Kericho",
    "Kiambu",
    "Kilifi",
    "Kirinyaga",
    "Kisii",
    "Kisumu",
    "Kitui",
    "Kwale",
    "Laikipia",
    "Lamu",
    "Machakos",
    "Makueni",
    "Mandera",
    "Marsabit",
    "Meru",
    "Migori",
    "Mombasa",
    "Murang'a",
    "Nairobi",
    "Nakuru",
    "Nandi",
    "Narok",
    "Nyamira",
    "Nyandarua",
    "Nyeri",
    "Samburu",
    "Siaya",
    "Taita-Taveta",
    "Tana River",
    "Tharaka-Nithi",
    "Trans Nzoia",
    "Turkana",
    "Uasin Gishu",
    "Vihiga",
    "Wajir",
    "West Pokot",
}


def sort_business_types(types: list[str]) -> list[str]:
    order = {value: index for index, value in enumerate(CANONICAL_BUSINESS_TYPES)}
    unique = list(dict.fromkeys(types))
    return sorted(
        unique, key=lambda item: order.get(item, len(CANONICAL_BUSINESS_TYPES))
    )


def validate_business_types(types: list[str]) -> list[str]:
    if not types:
        raise ValueError("At least one business type is required.")
    normalized = [item.strip().lower() for item in types if item.strip()]
    if len(normalized) != len(set(normalized)):
        raise ValueError("Duplicate business types are not allowed.")
    invalid = [item for item in normalized if item not in BUSINESS_TYPE_SET]
    if invalid:
        raise ValueError(f"Unsupported business type(s): {', '.join(sorted(invalid))}")
    if LEGACY_BUSINESS_TYPE_MIXED in normalized:
        raise ValueError("'mixed' is not a supported business type.")
    return sort_business_types(normalized)


def validate_service_availability(value: str, *, field: str) -> str:
    normalized = value.strip().lower()
    if normalized not in SERVICE_AVAILABILITY_OPTIONS:
        raise ValueError(f"Invalid {field} value '{value}'.")
    return normalized
