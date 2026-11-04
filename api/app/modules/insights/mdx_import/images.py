from __future__ import annotations

import mimetypes
from dataclasses import asdict, dataclass
from pathlib import Path

from app.core.config import settings
from app.modules.insights.r2_storage import (
    ImageStorageError,
    ImageUploadError,
    process_featured_upload,
    upload_processed_image,
)


@dataclass(frozen=True)
class FeaturedImagePlan:
    source_path: str | None
    local_file: str | None
    alt_text: str | None
    status: str
    storage_key: str | None = None
    public_url: str | None = None
    message: str | None = None


def resolve_local_featured_image(
    public_dir: Path, cover_image: str | None
) -> Path | None:
    if not cover_image:
        return None
    relative = cover_image.lstrip("/")
    candidate = public_dir / relative
    if candidate.is_file():
        return candidate
    return None


def plan_featured_image(
    *,
    public_dir: Path,
    cover_image: str | None,
    image_alt: str | None,
    upload: bool,
    dry_run: bool,
) -> FeaturedImagePlan:
    if not cover_image:
        return FeaturedImagePlan(
            source_path=None,
            local_file=None,
            alt_text=image_alt,
            status="not_configured",
            message="No featured image in frontmatter.",
        )

    local = resolve_local_featured_image(public_dir, cover_image)
    if local is None:
        return FeaturedImagePlan(
            source_path=cover_image,
            local_file=None,
            alt_text=image_alt,
            status="missing_asset",
            message=f"Local file not found under {public_dir}.",
        )

    if dry_run or not upload:
        return FeaturedImagePlan(
            source_path=cover_image,
            local_file=str(local),
            alt_text=image_alt,
            status="ready",
            message="Would upload to R2 when --upload-images is set (non-dry-run).",
        )

    data = local.read_bytes()
    content_type = mimetypes.guess_type(local.name)[0]
    try:
        processed = process_featured_upload(
            settings,
            filename=local.name,
            content_type=content_type,
            data=data,
        )
        upload_processed_image(settings, processed)
    except (ImageUploadError, ImageStorageError) as exc:
        return FeaturedImagePlan(
            source_path=cover_image,
            local_file=str(local),
            alt_text=image_alt,
            status="upload_failed",
            message=str(exc),
        )

    return FeaturedImagePlan(
        source_path=cover_image,
        local_file=str(local),
        alt_text=image_alt,
        status="uploaded",
        storage_key=processed.storage_key,
        public_url=processed.public_url,
        message="Uploaded featured image to R2.",
    )


def featured_image_plan_to_dict(plan: FeaturedImagePlan) -> dict[str, object | None]:
    return asdict(plan)
