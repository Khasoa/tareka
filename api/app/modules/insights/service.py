from __future__ import annotations

import re
import uuid
from datetime import UTC, date, datetime
from math import ceil
from typing import Any, cast

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.engine import CursorResult
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.modules.insights.document import (
    LINK_STRIPPED_NOTICE,
    DocumentValidationError,
    document_has_visible_content,
    empty_document,
    normalize_document,
    validate_article_slug,
    validate_document,
)
from app.modules.insights.models import InsightArticle, InsightCategory
from app.modules.insights.schemas import AdminArticleCreate, AdminArticleUpdate


class VersionConflictError(Exception):
    def __init__(self, current_version: int) -> None:
        self.current_version = current_version
        super().__init__("Article version conflict")


_SEO_TITLE_SUFFIX = re.compile(r"\s*\|\s*tareka\s*$", re.IGNORECASE)


def _normalize_seo_title(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = _SEO_TITLE_SUFFIX.sub("", value.strip())
    return cleaned or None


def featured_image_public_url(key: str | None) -> str | None:
    if not key:
        return None
    base = settings.r2_public_base_url.strip().rstrip("/")
    if not base:
        return None
    return f"{base}/{key.lstrip('/')}"


def category_name(article: InsightArticle) -> str | None:
    return article.category.name if article.category else None


def list_categories(db: Session, *, active_only: bool = False) -> list[InsightCategory]:
    query = select(InsightCategory).order_by(
        InsightCategory.sort_order,
        InsightCategory.name,
    )
    if active_only:
        query = query.where(InsightCategory.is_active.is_(True))
    return list(db.scalars(query).all())


def get_category(db: Session, category_id: int) -> InsightCategory | None:
    return db.get(InsightCategory, category_id)


def get_article(db: Session, article_id: int) -> InsightArticle | None:
    article = db.scalar(
        select(InsightArticle)
        .options(selectinload(InsightArticle.category))
        .where(InsightArticle.id == article_id)
    )
    if article is not None:
        article.body_json = normalize_document(article.body_json)
    return article


def get_published_article_by_slug(db: Session, slug: str) -> InsightArticle | None:
    try:
        normalized = validate_article_slug(slug)
    except ValueError:
        return None
    article = db.scalar(
        select(InsightArticle)
        .options(selectinload(InsightArticle.category))
        .where(
            InsightArticle.slug == normalized,
            InsightArticle.status == "published",
        )
    )
    if article is not None:
        article.body_json = normalize_document(article.body_json)
    return article


def paginate(total: int, page: int, page_size: int) -> dict[str, int]:
    return {
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": ceil(total / page_size) if total else 0,
    }


def list_public_articles(
    db: Session,
    *,
    page: int,
    page_size: int,
) -> tuple[list[InsightArticle], int]:
    query = (
        select(InsightArticle)
        .options(selectinload(InsightArticle.category))
        .where(InsightArticle.status == "published")
        .order_by(InsightArticle.published_at.desc(), InsightArticle.id.desc())
    )
    count_query = (
        select(func.count())
        .select_from(InsightArticle)
        .where(InsightArticle.status == "published")
    )
    total = db.scalar(count_query) or 0
    items = db.scalars(query.offset((page - 1) * page_size).limit(page_size)).all()
    for item in items:
        item.body_json = normalize_document(item.body_json)
    return list(items), total


def list_admin_articles(
    db: Session,
    *,
    page: int,
    page_size: int,
    status: str | None,
    category_id: int | None,
) -> tuple[list[InsightArticle], int]:
    query = select(InsightArticle).options(selectinload(InsightArticle.category))
    count_query = select(func.count()).select_from(InsightArticle)

    if status:
        query = query.where(InsightArticle.status == status)
        count_query = count_query.where(InsightArticle.status == status)
    if category_id is not None:
        query = query.where(InsightArticle.category_id == category_id)
        count_query = count_query.where(InsightArticle.category_id == category_id)

    query = query.order_by(InsightArticle.updated_at.desc(), InsightArticle.id.desc())
    total = db.scalar(count_query) or 0
    items = db.scalars(query.offset((page - 1) * page_size).limit(page_size)).all()
    for item in items:
        item.body_json = normalize_document(item.body_json)
    return list(items), total


def _apply_document(body: dict, *, draft_save: bool = False) -> tuple[dict, list[str]]:
    stripped: list[int] = []
    try:
        document = validate_document(
            body,
            strip_invalid_links=draft_save,
            stripped_out=stripped,
        )
    except DocumentValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    notices = [LINK_STRIPPED_NOTICE] if stripped and stripped[0] else []
    return document, notices


def _coerce_body_update(
    article: InsightArticle,
    body_json: dict,
    *,
    allow_empty_body: bool,
) -> tuple[dict, list[str]]:
    new_body, notices = _apply_document(body_json, draft_save=True)
    existing = normalize_document(article.body_json)
    if document_has_visible_content(new_body):
        return new_body, notices
    if not document_has_visible_content(existing):
        return new_body, notices
    if allow_empty_body:
        return new_body, notices
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="Cannot replace article body with empty content.",
    )


def _current_version(db: Session, article_id: int) -> int | None:
    return db.scalar(
        select(InsightArticle.version).where(InsightArticle.id == article_id)
    )


def _atomic_update(
    db: Session,
    article_id: int,
    expected_version: int,
    values: dict,
) -> None:
    stmt = (
        update(InsightArticle)
        .where(
            InsightArticle.id == article_id,
            InsightArticle.version == expected_version,
        )
        .values(
            **values,
            version=InsightArticle.version + 1,
            updated_at=datetime.now(UTC),
        )
    )
    result = cast(CursorResult[Any], db.execute(stmt))
    if result.rowcount != 1:
        db.rollback()
        current = _current_version(db, article_id)
        raise VersionConflictError(current if current is not None else expected_version)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Slug already exists.") from exc


def create_draft(db: Session, payload: AdminArticleCreate) -> InsightArticle:
    if payload.slug is not None:
        slug = payload.slug
    else:
        slug = validate_article_slug(f"draft-{uuid.uuid4().hex[:16]}")

    if (
        payload.category_id is not None
        and get_category(db, payload.category_id) is None
    ):
        raise HTTPException(status_code=422, detail="Category not found.")

    article = InsightArticle(
        slug=slug,
        title=(payload.title or "").strip(),
        excerpt="",
        category_id=payload.category_id,
        body_json=empty_document(),
        status="draft",
        version=1,
    )
    db.add(article)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Slug already exists.") from exc
    db.refresh(article)
    return article


def update_article(
    db: Session,
    article: InsightArticle,
    payload: AdminArticleUpdate,
) -> tuple[InsightArticle, list[str]]:
    if (
        article.status == "published"
        and payload.slug is not None
        and payload.slug != article.slug
    ):
        raise HTTPException(
            status_code=409,
            detail="Published article slugs cannot be changed.",
        )

    values: dict = {}
    save_notices: list[str] = []

    if payload.slug is not None:
        values["slug"] = payload.slug
    if payload.title is not None:
        values["title"] = payload.title.strip()
    if payload.excerpt is not None:
        values["excerpt"] = payload.excerpt.strip()
    if payload.category_id is not None:
        if get_category(db, payload.category_id) is None:
            raise HTTPException(status_code=422, detail="Category not found.")
        values["category_id"] = payload.category_id
    if payload.body_json is not None:
        new_body, notices = _coerce_body_update(
            article,
            payload.body_json,
            allow_empty_body=payload.allow_empty_body,
        )
        values["body_json"] = new_body
        save_notices = notices
    if payload.published_at is not None:
        values["published_at"] = payload.published_at
    if payload.featured_image_key is not None:
        values["featured_image_key"] = payload.featured_image_key.strip() or None
    if payload.featured_image_alt is not None:
        values["featured_image_alt"] = payload.featured_image_alt.strip() or None
    if payload.featured_image_caption is not None:
        values["featured_image_caption"] = (
            payload.featured_image_caption.strip() or None
        )
    if payload.seo_title is not None:
        values["seo_title"] = _normalize_seo_title(payload.seo_title.strip() or None)
    if payload.meta_description is not None:
        values["meta_description"] = payload.meta_description.strip() or None

    featured_key = values.get("featured_image_key", article.featured_image_key)
    featured_alt = values.get("featured_image_alt", article.featured_image_alt)
    if featured_key and not (featured_alt or "").strip():
        raise HTTPException(
            status_code=422,
            detail="Featured image requires meaningful alt text.",
        )

    if not values:
        return article, []

    _atomic_update(db, article.id, payload.version, values)
    updated = get_article(db, article.id)
    if updated is None:
        raise HTTPException(status_code=404, detail="Article not found")
    return updated, save_notices


def _validate_publishable(db: Session, article: InsightArticle) -> None:
    if not article.title.strip():
        raise HTTPException(status_code=422, detail="Title is required to publish.")
    if not article.slug.strip():
        raise HTTPException(status_code=422, detail="Slug is required to publish.")
    if article.category_id is None:
        raise HTTPException(status_code=422, detail="Category is required to publish.")
    if get_category(db, article.category_id) is None:
        raise HTTPException(status_code=422, detail="Category not found.")
    if not article.excerpt.strip():
        raise HTTPException(status_code=422, detail="Excerpt is required to publish.")
    if not document_has_visible_content(normalize_document(article.body_json)):
        raise HTTPException(
            status_code=422, detail="Article body is required to publish."
        )
    if article.published_at is None:
        raise HTTPException(
            status_code=422,
            detail="Publication date is required to publish.",
        )
    if article.featured_image_key and not (article.featured_image_alt or "").strip():
        raise HTTPException(
            status_code=422,
            detail="Featured image requires meaningful alt text.",
        )
    try:
        validate_document(normalize_document(article.body_json))
    except DocumentValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


def publish_article(
    db: Session,
    article: InsightArticle,
    *,
    version: int,
    published_at: date | None,
) -> InsightArticle:
    working = get_article(db, article.id)
    if working is None:
        raise HTTPException(status_code=404, detail="Article not found")

    if published_at is not None:
        working.published_at = published_at
    if working.published_at is None:
        working.published_at = datetime.now(UTC).date()

    _validate_publishable(db, working)

    _atomic_update(
        db,
        working.id,
        version,
        {
            "status": "published",
            "published_at": working.published_at,
        },
    )
    published = get_article(db, working.id)
    if published is None:
        raise HTTPException(status_code=404, detail="Article not found")
    return published


def unpublish_article(
    db: Session,
    article: InsightArticle,
    *,
    version: int,
) -> InsightArticle:
    if article.status != "published":
        raise HTTPException(status_code=409, detail="Article is not published.")

    _atomic_update(
        db,
        article.id,
        version,
        {"status": "draft"},
    )
    updated = get_article(db, article.id)
    if updated is None:
        raise HTTPException(status_code=404, detail="Article not found")
    return updated


def delete_draft(db: Session, article: InsightArticle) -> None:
    if article.status != "draft":
        raise HTTPException(
            status_code=409,
            detail="Only draft articles can be deleted.",
        )
    db.delete(article)
    db.commit()
