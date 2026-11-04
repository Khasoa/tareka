"""Cloudflare R2 uploads for Insights featured images."""

from __future__ import annotations

import io
import logging
import uuid
from dataclasses import dataclass
from typing import BinaryIO

import boto3
from botocore.client import BaseClient
from botocore.exceptions import BotoCoreError, ClientError
from PIL import Image, UnidentifiedImageError

from app.core.config import Settings

logger = logging.getLogger(__name__)

ALLOWED_OUTPUT_FORMATS = {
    "JPEG": ("image/jpeg", ".jpg"),
    "PNG": ("image/png", ".png"),
    "WEBP": ("image/webp", ".webp"),
}

# Decompression bomb protection (roughly 40 megapixels).
Image.MAX_IMAGE_PIXELS = 40_000_000

MAX_IMAGE_WIDTH = 8000
MAX_IMAGE_HEIGHT = 8000


class ImageUploadError(ValueError):
    pass


class ImageStorageError(RuntimeError):
    pass


@dataclass(frozen=True)
class ProcessedImage:
    data: bytes
    content_type: str
    width: int
    height: int
    storage_key: str
    public_url: str


def _require_r2_settings(settings: Settings) -> None:
    missing = [
        name
        for name, value in {
            "R2_ACCOUNT_ID": settings.r2_account_id,
            "R2_ACCESS_KEY_ID": settings.r2_access_key_id,
            "R2_SECRET_ACCESS_KEY": settings.r2_secret_access_key,
            "R2_BUCKET_NAME": settings.r2_bucket_name,
            "R2_PUBLIC_BASE_URL": settings.r2_public_base_url,
        }.items()
        if not (value and str(value).strip())
    ]
    if missing:
        raise ImageStorageError(
            "Image upload is not configured. Missing: " + ", ".join(missing)
        )


def build_r2_client(settings: Settings) -> BaseClient:
    _require_r2_settings(settings)
    endpoint = f"https://{settings.r2_account_id.strip()}.r2.cloudflarestorage.com"
    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=settings.r2_access_key_id.strip(),
        aws_secret_access_key=settings.r2_secret_access_key.strip(),
        region_name="auto",
    )


def public_url_for_key(settings: Settings, storage_key: str) -> str:
    base = settings.r2_public_base_url.strip().rstrip("/")
    return f"{base}/{storage_key.lstrip('/')}"


def process_featured_upload(
    settings: Settings,
    *,
    filename: str | None,
    content_type: str | None,
    data: bytes,
) -> ProcessedImage:
    if len(data) > settings.insight_image_max_bytes:
        raise ImageUploadError("Image exceeds the maximum upload size.")

    if len(data) == 0:
        raise ImageUploadError("Uploaded file is empty.")

    try:
        image: Image.Image = Image.open(io.BytesIO(data))
        image.load()
    except (UnidentifiedImageError, OSError) as exc:
        raise ImageUploadError("Uploaded file is not a supported image.") from exc

    fmt = (image.format or "").upper()
    if fmt not in ALLOWED_OUTPUT_FORMATS:
        raise ImageUploadError("Only JPEG, PNG and WebP images are supported.")

    width, height = image.size
    if width > MAX_IMAGE_WIDTH or height > MAX_IMAGE_HEIGHT:
        raise ImageUploadError("Image dimensions exceed the allowed maximum.")

    if fmt in {"JPEG", "WEBP"} and image.mode not in {"RGB", "L"}:
        image = image.convert("RGB")
    elif fmt == "PNG" and image.mode not in {"RGB", "RGBA", "L"}:
        image = image.convert("RGBA")

    output = io.BytesIO()
    mime_type, extension = ALLOWED_OUTPUT_FORMATS[fmt]
    save_kwargs: dict[str, object] = {}
    if fmt == "JPEG":
        save_kwargs = {"quality": 88, "optimize": True}
    elif fmt == "WEBP":
        save_kwargs = {"quality": 88, "method": 6}
    elif fmt == "PNG":
        save_kwargs = {"optimize": True}

    image.save(output, format=fmt, **save_kwargs)
    cleaned = output.getvalue()

    storage_key = f"insights/featured/{uuid.uuid4().hex}{extension}"
    public_url = public_url_for_key(settings, storage_key)

    if filename:
        del filename
    if content_type:
        del content_type

    return ProcessedImage(
        data=cleaned,
        content_type=mime_type,
        width=width,
        height=height,
        storage_key=storage_key,
        public_url=public_url,
    )


def upload_processed_image(
    settings: Settings,
    processed: ProcessedImage,
    *,
    client: BaseClient | None = None,
) -> None:
    _require_r2_settings(settings)
    s3 = client or build_r2_client(settings)
    try:
        s3.put_object(
            Bucket=settings.r2_bucket_name.strip(),
            Key=processed.storage_key,
            Body=processed.data,
            ContentType=processed.content_type,
            CacheControl="public, max-age=31536000, immutable",
        )
    except (ClientError, BotoCoreError) as exc:
        logger.warning("R2 upload failed for featured image.")
        raise ImageStorageError("Image upload failed.") from exc


def upload_featured_image(
    settings: Settings,
    *,
    filename: str | None,
    content_type: str | None,
    stream: BinaryIO,
    client: BaseClient | None = None,
) -> ProcessedImage:
    data = stream.read()
    processed = process_featured_upload(
        settings,
        filename=filename,
        content_type=content_type,
        data=data,
    )
    upload_processed_image(settings, processed, client=client)
    return processed
