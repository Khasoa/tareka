"""Background Insights revalidation — isolated from request-scoped DB sessions."""

from __future__ import annotations

import logging

from app.core.config import settings
from app.modules.insights.revalidation import RevalidationClient, RevalidationRequest

logger = logging.getLogger(__name__)


def run_insights_revalidation(slug: str | None) -> None:
    """Notify Next.js to revalidate cached Insights routes (best-effort)."""
    try:
        client = RevalidationClient(settings)
        client.notify(RevalidationRequest(slug=slug))
    except Exception:
        logger.exception("Insights revalidation background task failed.")
