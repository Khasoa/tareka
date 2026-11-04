"""Reject state-changing browser requests with missing or untrusted Origin headers."""

from collections.abc import Callable

from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.core.config import settings
from app.core.origins import origin_is_trusted, trusted_browser_origins

_STATE_CHANGING_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})


async def validate_state_changing_origin(
    request: Request,
    call_next: Callable,
) -> Response:
    if request.method == "OPTIONS":
        return await call_next(request)

    if request.method not in _STATE_CHANGING_METHODS:
        return await call_next(request)

    origin = request.headers.get("origin")
    if not origin:
        return JSONResponse(
            status_code=403,
            content={"detail": "Origin header required"},
        )

    allowed = trusted_browser_origins(settings)
    if not origin_is_trusted(origin, allowed):
        return JSONResponse(
            status_code=403,
            content={"detail": "Origin not allowed"},
        )

    return await call_next(request)
