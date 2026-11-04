import io
from math import ceil

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
)

from app.core.config import settings
from app.core.deps import DbSession
from app.modules.admin.audit import record_audit
from app.modules.admin.models import AdminUser
from app.modules.admin.service import require_admin
from app.modules.insights import serializers, service
from app.modules.insights.r2_storage import (
    ImageStorageError,
    ImageUploadError,
)
from app.modules.insights.r2_storage import (
    upload_featured_image as store_featured_image,
)
from app.modules.insights.revalidation_tasks import run_insights_revalidation
from app.modules.insights.schemas import (
    AdminArticleCreate,
    AdminArticleDetail,
    AdminArticleListResponse,
    AdminArticlePublish,
    AdminArticleUnpublish,
    AdminArticleUpdate,
    CategoryResponse,
    FeaturedImageUploadResponse,
)
from app.modules.insights.service import VersionConflictError

router = APIRouter(prefix="/api/admin/insights", tags=["admin-insights"])


def _conflict_response(exc: VersionConflictError) -> HTTPException:
    return HTTPException(
        status_code=409,
        detail={
            "message": "Article was updated elsewhere.",
            "current_version": exc.current_version,
        },
    )


@router.get("/categories", response_model=list[CategoryResponse])
def list_insight_categories(
    db: DbSession,
    admin: AdminUser = Depends(require_admin),
) -> list[CategoryResponse]:
    del admin
    categories = service.list_categories(db)
    return [CategoryResponse.model_validate(item) for item in categories]


@router.get("", response_model=AdminArticleListResponse)
def list_insight_articles(
    db: DbSession,
    admin: AdminUser = Depends(require_admin),
    status: str | None = Query(default=None, pattern="^(draft|published)$"),
    category_id: int | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
) -> AdminArticleListResponse:
    del admin
    articles, total = service.list_admin_articles(
        db,
        page=page,
        page_size=page_size,
        status=status,
        category_id=category_id,
    )
    return AdminArticleListResponse(
        items=[serializers.serialize_admin_summary(article) for article in articles],
        page=page,
        page_size=page_size,
        total=total,
        total_pages=ceil(total / page_size) if total else 0,
    )


@router.post("", response_model=AdminArticleDetail, status_code=201)
def create_insight_article(
    body: AdminArticleCreate,
    db: DbSession,
    admin: AdminUser = Depends(require_admin),
) -> AdminArticleDetail:
    article = service.create_draft(db, body)
    record_audit(
        db,
        admin_id=admin.id,
        action="create_insight_article",
        entity="insight_article",
        entity_id=article.id,
        before=None,
        after={"slug": article.slug, "status": article.status},
    )
    db.commit()
    return serializers.serialize_admin_detail(article)


@router.get("/{article_id}", response_model=AdminArticleDetail)
def get_insight_article(
    article_id: int,
    db: DbSession,
    admin: AdminUser = Depends(require_admin),
) -> AdminArticleDetail:
    del admin
    article = service.get_article(db, article_id)
    if article is None:
        raise HTTPException(status_code=404, detail="Article not found")
    return serializers.serialize_admin_detail(article)


@router.patch("/{article_id}", response_model=AdminArticleDetail)
def update_insight_article(
    article_id: int,
    body: AdminArticleUpdate,
    background_tasks: BackgroundTasks,
    db: DbSession,
    admin: AdminUser = Depends(require_admin),
) -> AdminArticleDetail:
    article = service.get_article(db, article_id)
    if article is None:
        raise HTTPException(status_code=404, detail="Article not found")

    before = {
        "slug": article.slug,
        "status": article.status,
        "version": article.version,
    }
    try:
        updated, save_notices = service.update_article(db, article, body)
    except VersionConflictError as exc:
        raise _conflict_response(exc) from exc

    record_audit(
        db,
        admin_id=admin.id,
        action="update_insight_article",
        entity="insight_article",
        entity_id=updated.id,
        before=before,
        after={
            "slug": updated.slug,
            "status": updated.status,
            "version": updated.version,
        },
    )
    db.commit()

    if updated.status == "published":
        background_tasks.add_task(run_insights_revalidation, updated.slug)

    return serializers.serialize_admin_detail(updated, save_notices=save_notices)


@router.post("/{article_id}/publish", response_model=AdminArticleDetail)
def publish_insight_article(
    article_id: int,
    body: AdminArticlePublish,
    background_tasks: BackgroundTasks,
    db: DbSession,
    admin: AdminUser = Depends(require_admin),
) -> AdminArticleDetail:
    article = service.get_article(db, article_id)
    if article is None:
        raise HTTPException(status_code=404, detail="Article not found")

    before = {"status": article.status, "version": article.version}
    try:
        published = service.publish_article(
            db,
            article,
            version=body.version,
            published_at=body.published_at,
        )
    except VersionConflictError as exc:
        raise _conflict_response(exc) from exc

    record_audit(
        db,
        admin_id=admin.id,
        action="publish_insight_article",
        entity="insight_article",
        entity_id=published.id,
        before=before,
        after={"status": published.status, "version": published.version},
    )
    db.commit()
    background_tasks.add_task(run_insights_revalidation, published.slug)
    return serializers.serialize_admin_detail(published)


@router.post("/{article_id}/unpublish", response_model=AdminArticleDetail)
def unpublish_insight_article(
    article_id: int,
    body: AdminArticleUnpublish,
    background_tasks: BackgroundTasks,
    db: DbSession,
    admin: AdminUser = Depends(require_admin),
) -> AdminArticleDetail:
    article = service.get_article(db, article_id)
    if article is None:
        raise HTTPException(status_code=404, detail="Article not found")

    before = {"status": article.status, "version": article.version}
    slug = article.slug
    try:
        updated = service.unpublish_article(db, article, version=body.version)
    except VersionConflictError as exc:
        raise _conflict_response(exc) from exc

    record_audit(
        db,
        admin_id=admin.id,
        action="unpublish_insight_article",
        entity="insight_article",
        entity_id=updated.id,
        before=before,
        after={"status": updated.status, "version": updated.version},
    )
    db.commit()
    background_tasks.add_task(run_insights_revalidation, slug)
    return serializers.serialize_admin_detail(updated)


@router.delete("/{article_id}", status_code=204)
def delete_insight_article(
    article_id: int,
    db: DbSession,
    admin: AdminUser = Depends(require_admin),
) -> None:
    article = service.get_article(db, article_id)
    if article is None:
        raise HTTPException(status_code=404, detail="Article not found")

    before = {"slug": article.slug, "status": article.status}
    service.delete_draft(db, article)
    record_audit(
        db,
        admin_id=admin.id,
        action="delete_insight_article",
        entity="insight_article",
        entity_id=article_id,
        before=before,
        after=None,
    )
    db.commit()


@router.post("/featured-image/upload", response_model=FeaturedImageUploadResponse)
async def upload_featured_image(
    db: DbSession,
    admin: AdminUser = Depends(require_admin),
    file: UploadFile = File(...),
) -> FeaturedImageUploadResponse:
    del db, admin
    data = await file.read()
    try:
        processed = store_featured_image(
            settings,
            filename=file.filename,
            content_type=file.content_type,
            stream=io.BytesIO(data),
        )
    except ImageUploadError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except ImageStorageError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return FeaturedImageUploadResponse(
        storage_key=processed.storage_key,
        public_url=processed.public_url,
        width=processed.width,
        height=processed.height,
        content_type=processed.content_type,
    )
