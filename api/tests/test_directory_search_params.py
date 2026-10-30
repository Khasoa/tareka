"""Contract tests for directory URL param normalization (mirrors web/src/lib/directorySearchParams.ts)."""

from app.modules.directory.constants import (
    CANONICAL_BUSINESS_TYPES,
    LEGACY_BUSINESS_TYPE_MIXED,
)


def _business_type_query_for_api(raw: str | None) -> str:
    value = (raw or "").strip().lower()
    if not value or value not in CANONICAL_BUSINESS_TYPES:
        return ""
    return value


def test_mixed_omitted_from_api_query():
    assert _business_type_query_for_api(LEGACY_BUSINESS_TYPE_MIXED) == ""


def test_invalid_type_omitted_from_api_query():
    assert _business_type_query_for_api("foo") == ""
    assert _business_type_query_for_api("recycler") == "recycler"


def test_canonical_types_pass_through():
    for value in CANONICAL_BUSINESS_TYPES:
        assert _business_type_query_for_api(value) == value
