from datetime import UTC, datetime

from app.modules.insights.models import InsightArticle
from app.modules.insights.schemas import (
    AdminArticleDetail,
    AdminArticleSummary,
    PublicArticleDetail,
    PublicArticleSummary,
)
from app.modules.insights.service import category_name, featured_image_public_url


def serialize_public_summary(article: InsightArticle) -> PublicArticleSummary:
    return PublicArticleSummary(
        slug=article.slug,
        title=article.title,
        excerpt=article.excerpt,
        category=category_name(article) or "",
        published_at=article.published_at or datetime.now(UTC).date(),
        featured_image_url=featured_image_public_url(article.featured_image_key),
        featured_image_alt=article.featured_image_alt,
        featured_image_caption=article.featured_image_caption,
        seo_title=article.seo_title,
        meta_description=article.meta_description,
    )


def serialize_public_detail(article: InsightArticle) -> PublicArticleDetail:
    summary = serialize_public_summary(article)
    return PublicArticleDetail(
        **summary.model_dump(),
        body_json=article.body_json,
    )


def serialize_admin_summary(article: InsightArticle) -> AdminArticleSummary:
    return AdminArticleSummary(
        id=article.id,
        slug=article.slug,
        title=article.title,
        excerpt=article.excerpt,
        status=article.status,  # type: ignore[arg-type]
        category_id=article.category_id,
        category_name=category_name(article),
        published_at=article.published_at,
        version=article.version,
        updated_at=article.updated_at,
        featured_image_key=article.featured_image_key,
        featured_image_alt=article.featured_image_alt,
    )


def serialize_admin_detail(
    article: InsightArticle,
    *,
    save_notices: list[str] | None = None,
) -> AdminArticleDetail:
    summary = serialize_admin_summary(article)
    return AdminArticleDetail(
        **summary.model_dump(),
        body_json=article.body_json,
        featured_image_caption=article.featured_image_caption,
        seo_title=article.seo_title,
        meta_description=article.meta_description,
        featured_image_url=featured_image_public_url(article.featured_image_key),
        created_at=article.created_at,
        save_notices=save_notices or [],
    )
