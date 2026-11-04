from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Any

import yaml

from app.modules.insights.document import validate_article_slug

_FRONTMATTER_PATTERN = re.compile(r"\A---\r?\n(.*?)\r?\n---\r?\n", re.DOTALL)


@dataclass(frozen=True)
class ParsedMdxArticle:
    filename: str
    path: Path
    frontmatter: dict[str, Any]
    body: str


class FrontmatterError(ValueError):
    pass


def _required_string(data: dict[str, Any], field: str, filename: str) -> str:
    value = data.get(field)
    if not isinstance(value, str) or not value.strip():
        raise FrontmatterError(
            f'Invalid insight "{filename}": "{field}" must be a non-empty string.',
        )
    return value.strip()


def _optional_string(data: dict[str, Any], field: str) -> str | None:
    value = data.get(field)
    if value is None:
        return None
    if not isinstance(value, str) or not value.strip():
        return None
    return value.strip()


def parse_mdx_file(path: Path) -> ParsedMdxArticle:
    raw = path.read_text(encoding="utf-8")
    match = _FRONTMATTER_PATTERN.match(raw)
    if not match:
        raise FrontmatterError(
            f'Invalid insight "{path.name}": missing YAML frontmatter.'
        )

    meta = yaml.safe_load(match.group(1))
    if not isinstance(meta, dict):
        raise FrontmatterError(
            f'Invalid insight "{path.name}": frontmatter must be a mapping.',
        )

    body = raw[match.end() :]
    filename = path.name
    title = _required_string(meta, "title", filename)
    slug = _required_string(meta, "slug", filename)
    excerpt = _required_string(meta, "excerpt", filename)
    category = _required_string(meta, "category", filename)
    published_raw = _required_string(meta, "published_at", filename)

    expected_slug = path.stem
    if slug != expected_slug:
        raise FrontmatterError(
            f'Invalid insight "{filename}": slug must match filename ("{expected_slug}").',
        )

    validate_article_slug(slug)

    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", published_raw):
        raise FrontmatterError(
            f'Invalid insight "{filename}": published_at must use YYYY-MM-DD.',
        )
    published_at = date.fromisoformat(published_raw)

    cover_image = _optional_string(meta, "cover_image")
    image_alt = _optional_string(meta, "image_alt")
    if cover_image and not cover_image.startswith("/images/insights/"):
        raise FrontmatterError(
            f'Invalid insight "{filename}": cover_image must use /images/insights/.',
        )
    if cover_image and not (image_alt or "").strip():
        raise FrontmatterError(
            f'Invalid insight "{filename}": image_alt required when cover_image is set.',
        )

    frontmatter = {
        "title": title,
        "slug": slug,
        "excerpt": excerpt,
        "category": category,
        "published_at": published_at,
        "seo_title": _optional_string(meta, "seo_title"),
        "meta_description": _optional_string(meta, "meta_description"),
        "cover_image": cover_image,
        "image_alt": image_alt,
    }

    return ParsedMdxArticle(
        filename=filename, path=path, frontmatter=frontmatter, body=body
    )


def discover_mdx_files(content_dir: Path) -> list[Path]:
    if not content_dir.is_dir():
        return []
    return sorted(content_dir.glob("*.mdx"))
