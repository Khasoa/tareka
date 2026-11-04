"""Notify the Next.js site to revalidate cached Insights routes."""

from __future__ import annotations

import logging
from dataclasses import dataclass

import httpx

from app.core.config import Settings

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class RevalidationRequest:
    slug: str | None = None
    include_index: bool = True
    include_sitemap: bool = True


class RevalidationClient:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    @property
    def enabled(self) -> bool:
        return bool(
            self._settings.next_revalidate_url.strip()
            and self._settings.next_revalidate_secret.strip()
        )

    def notify(self, request: RevalidationRequest) -> bool:
        if not self.enabled:
            return False

        paths: list[str] = []
        if request.include_index:
            paths.append("/insights")
        if request.slug:
            paths.append(f"/insights/{request.slug}")
        if request.include_sitemap:
            paths.append("/sitemap.xml")

        payload = {
            "paths": paths,
            "slug": request.slug,
        }
        url = self._settings.next_revalidate_url.strip()
        timeout = self._settings.next_revalidate_timeout_seconds

        try:
            response = httpx.post(
                url,
                json=payload,
                headers={
                    "Authorization": (
                        f"Bearer {self._settings.next_revalidate_secret.strip()}"
                    ),
                },
                timeout=timeout,
            )
        except (httpx.HTTPError, TimeoutError):
            logger.warning("Insights revalidation request failed (network error).")
            return False

        if response.status_code >= 400:
            logger.warning(
                "Insights revalidation request failed (status %s).",
                response.status_code,
            )
            return False

        return True
