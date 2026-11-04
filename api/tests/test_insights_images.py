import io
from unittest.mock import MagicMock

import pytest
from PIL import Image

from app.core.config import Settings
from app.modules.insights.r2_storage import (
    ImageStorageError,
    ImageUploadError,
    process_featured_upload,
    upload_processed_image,
)


@pytest.fixture
def r2_settings():
    return Settings(
        database_url="postgresql+psycopg://local/test",
        r2_account_id="account-id",
        r2_access_key_id="access-key",
        r2_secret_access_key="secret-key",
        r2_bucket_name="tareka-insights",
        r2_public_base_url="https://images.tareka.directory",
        insight_image_max_bytes=5_000_000,
    )


def _jpeg_with_exif() -> bytes:
    image = Image.new("RGB", (120, 80), color="red")
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=90)
    return buffer.getvalue()


def test_valid_upload_is_processed_and_strips_exif(r2_settings):
    processed = process_featured_upload(
        r2_settings,
        filename="photo.jpg",
        content_type="image/jpeg",
        data=_jpeg_with_exif(),
    )
    assert processed.storage_key.startswith("insights/featured/")
    reopened = Image.open(io.BytesIO(processed.data))
    assert reopened.getexif() == {} or len(reopened.getexif()) == 0


def test_spoofed_filename_does_not_bypass_content_validation(r2_settings):
    png = io.BytesIO()
    Image.new("RGB", (20, 20), "blue").save(png, format="PNG")
    processed = process_featured_upload(
        r2_settings,
        filename="fake.jpg",
        content_type="image/jpeg",
        data=png.getvalue(),
    )
    assert processed.content_type == "image/png"


def test_malformed_image_is_rejected(r2_settings):
    with pytest.raises(ImageUploadError):
        process_featured_upload(
            r2_settings,
            filename="broken.jpg",
            content_type="image/jpeg",
            data=b"not-an-image",
        )


def test_oversized_file_is_rejected(r2_settings):
    r2_settings.insight_image_max_bytes = 10
    with pytest.raises(ImageUploadError):
        process_featured_upload(
            r2_settings,
            filename="big.jpg",
            content_type="image/jpeg",
            data=b"x" * 20,
        )


def test_excessive_dimensions_are_rejected(r2_settings):
    image = Image.new("RGB", (9000, 100), "green")
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG")
    with pytest.raises(ImageUploadError):
        process_featured_upload(
            r2_settings,
            filename="wide.jpg",
            content_type="image/jpeg",
            data=buffer.getvalue(),
        )


def test_svg_upload_is_rejected(r2_settings):
    svg = (
        b'<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>'
    )
    with pytest.raises(ImageUploadError):
        process_featured_upload(
            r2_settings,
            filename="icon.svg",
            content_type="image/svg+xml",
            data=svg,
        )


def test_html_upload_is_rejected(r2_settings):
    html = b"<html><body>not an image</body></html>"
    with pytest.raises(ImageUploadError):
        process_featured_upload(
            r2_settings,
            filename="page.html",
            content_type="text/html",
            data=html,
        )


def test_html_spoofed_as_png_is_rejected(r2_settings):
    html = b"<html><body>not an image</body></html>"
    with pytest.raises(ImageUploadError):
        process_featured_upload(
            r2_settings,
            filename="photo.png",
            content_type="image/png",
            data=html,
        )


def test_svg_spoofed_as_png_is_rejected(r2_settings):
    svg = (
        b'<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>'
    )
    with pytest.raises(ImageUploadError):
        process_featured_upload(
            r2_settings,
            filename="photo.png",
            content_type="image/png",
            data=svg,
        )


def test_r2_upload_failure_does_not_return_processed_object(r2_settings):
    processed = process_featured_upload(
        r2_settings,
        filename="photo.webp",
        content_type="image/webp",
        data=_jpeg_with_exif(),
    )
    failing_client = MagicMock()
    failing_client.put_object.side_effect = ImageStorageError("upload failed")

    with pytest.raises(ImageStorageError):
        upload_processed_image(
            r2_settings,
            processed,
            client=failing_client,
        )
