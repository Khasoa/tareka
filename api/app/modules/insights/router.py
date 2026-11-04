from math import ceil

from fastapi import APIRouter, HTTPException, Query

from app.core.deps import DbSession
from app.modules.insights import serializers, service
from app.modules.insights.schemas import (
    PublicArticleDetail,
    PublicArticleListResponse,
)

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("", response_model=PublicArticleListResponse)
def list_published_insights(
    db: DbSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
) -> PublicArticleListResponse:
    articles, total = service.list_public_articles(
        db,
        page=page,
        page_size=page_size,
    )
    return PublicArticleListResponse(
        items=[serializers.serialize_public_summary(article) for article in articles],
        page=page,
        page_size=page_size,
        total=total,
        total_pages=ceil(total / page_size) if total else 0,
    )


@router.get("/{slug}", response_model=PublicArticleDetail)
def get_published_insight(slug: str, db: DbSession) -> PublicArticleDetail:
    article = service.get_published_article_by_slug(db, slug)
    if article is None:
        raise HTTPException(status_code=404, detail="Article not found")
    return serializers.serialize_public_detail(article)
