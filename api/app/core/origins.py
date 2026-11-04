"""Trusted browser Origin allowlist for CORS and mutation requests."""

from app.core.config import Settings


def trusted_browser_origins(settings: Settings) -> list[str]:
    """Exact Origin header values allowed for credentialed browser traffic."""
    configured = [
        origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()
    ]
    primary = settings.frontend_origin.strip()
    origins = [primary, *configured] if primary else configured

    if settings.environment != "production":
        origins.extend(
            [
                "http://localhost:3000",
                "http://localhost:3010",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:3010",
            ]
        )

    return list(dict.fromkeys(origin for origin in origins if origin))


def origin_is_trusted(origin: str, allowed: list[str]) -> bool:
    """Exact match only — no suffix or substring rules."""
    return origin in allowed
