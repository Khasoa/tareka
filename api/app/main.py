from collections.abc import Callable

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from starlette.requests import Request
from starlette.responses import Response

from app.core.browser_origin import validate_state_changing_origin
from app.core.config import settings
from app.core.database import engine
from app.core.origins import trusted_browser_origins
from app.core.rate_limit import limiter
from app.modules.admin.router import router as admin_router
from app.modules.claims.router import router as claims_router
from app.modules.directory.reference_router import router as directory_router
from app.modules.directory.router import router as business_router
from app.modules.insights.admin_router import router as insights_admin_router
from app.modules.insights.router import router as insights_router
from app.modules.suggestions.router import router as suggestions_router

_docs_enabled = settings.environment != "production"


def api_documentation_enabled(environment: str) -> bool:
    """Shared rule for disabling Swagger/ReDoc/OpenAPI in production."""
    return environment != "production"


app = FastAPI(
    title="Tareka API",
    docs_url="/docs" if _docs_enabled else None,
    redoc_url="/redoc" if _docs_enabled else None,
    openapi_url="/openapi.json" if _docs_enabled else None,
)

app.state.limiter = limiter


def rate_limit_exception_handler(
    request: Request,
    exc: Exception,
) -> Response:
    if not isinstance(exc, RateLimitExceeded):
        raise exc

    return _rate_limit_exceeded_handler(request, exc)


app.add_exception_handler(
    RateLimitExceeded,
    rate_limit_exception_handler,
)


@app.middleware("http")
async def enforce_browser_origin(
    request: Request,
    call_next: Callable,
) -> Response:
    return await validate_state_changing_origin(request, call_next)


@app.middleware("http")
async def add_security_headers(
    request: Request,
    call_next: Callable,
) -> Response:
    response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    if settings.environment == "production":
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )

    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=trusted_browser_origins(settings),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
)

app.include_router(directory_router)
app.include_router(business_router)
app.include_router(insights_router)
app.include_router(admin_router)
app.include_router(insights_admin_router)
app.include_router(suggestions_router)
app.include_router(claims_router)


@app.get("/health")
def health() -> dict[str, str]:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {"status": "ok", "database": "connected"}

    except SQLAlchemyError:
        return {"status": "error", "database": "unavailable"}
