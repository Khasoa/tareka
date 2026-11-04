from __future__ import annotations

from datetime import date

import pytest
from sqlalchemy import select
from sqlalchemy.orm import sessionmaker

from app.core.config import Settings
from app.modules.insights.models import InsightArticle, InsightCategory
from app.modules.insights.revalidation import RevalidationClient, RevalidationRequest
from app.modules.insights.revalidation_tasks import run_insights_revalidation
from app.modules.insights.schemas import AdminArticleUpdate
from app.modules.insights.service import (
    VersionConflictError,
    publish_article,
    unpublish_article,
    update_article,
)


@pytest.fixture
def insight_categories(db_session):
    categories = [
        InsightCategory(slug="foundations", name="Foundations", sort_order=1),
        InsightCategory(
            slug="recovery-in-practice",
            name="Recovery in Practice",
            sort_order=2,
        ),
    ]
    db_session.add_all(categories)
    db_session.commit()
    return categories


def test_run_insights_revalidation_background_task(monkeypatch):
    calls: list[RevalidationRequest] = []

    def record_notify(self, request: RevalidationRequest) -> bool:
        calls.append(request)
        return True

    monkeypatch.setattr(RevalidationClient, "notify", record_notify)
    run_insights_revalidation("example-slug")
    assert len(calls) == 1
    assert calls[0].slug == "example-slug"


def test_publish_commits_without_inline_revalidation(db_session, insight_categories):
    article = InsightArticle(
        slug="publish-me",
        title="Title",
        excerpt="Excerpt",
        category_id=insight_categories[0].id,
        body_json={
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "Body"}],
                }
            ],
        },
        status="draft",
        published_at=date(2026, 10, 1),
        version=1,
    )
    db_session.add(article)
    db_session.commit()

    published = publish_article(db_session, article, version=1, published_at=None)
    assert published.status == "published"
    stored = db_session.get(InsightArticle, published.id)
    assert stored is not None
    assert stored.status == "published"


def test_unpublish_commits_without_inline_revalidation(db_session, insight_categories):
    article = InsightArticle(
        slug="unpublish-me",
        title="Title",
        excerpt="Excerpt",
        category_id=insight_categories[0].id,
        body_json={
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "Body"}],
                }
            ],
        },
        status="published",
        published_at=date(2026, 10, 1),
        version=2,
    )
    db_session.add(article)
    db_session.commit()

    updated = unpublish_article(db_session, article, version=2)
    assert updated.status == "draft"


def test_revalidation_client_handles_timeout(monkeypatch):
    settings = Settings(
        database_url="postgresql+psycopg://local/test",
        next_revalidate_url="https://example.org/api/revalidate",
        next_revalidate_secret="secret",
    )
    client = RevalidationClient(settings)

    def raise_timeout(*args, **kwargs):
        raise TimeoutError("timeout")

    monkeypatch.setattr(
        "app.modules.insights.revalidation.httpx.post",
        raise_timeout,
    )
    assert client.notify(RevalidationRequest(slug="slug")) is False


def test_stale_update_is_rejected(db_session, insight_categories):
    article = InsightArticle(
        slug="stale-update",
        title="Title",
        excerpt="Excerpt",
        category_id=insight_categories[0].id,
        body_json={
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "Body"}],
                }
            ],
        },
        status="draft",
        published_at=date(2026, 10, 1),
        version=3,
    )
    db_session.add(article)
    db_session.commit()

    with pytest.raises(VersionConflictError):
        update_article(
            db_session,
            article,
            AdminArticleUpdate(version=2, title="New title"),
        )

    unchanged = db_session.scalar(
        select(InsightArticle).where(InsightArticle.id == article.id)
    )
    assert unchanged is not None
    assert unchanged.title == "Title"
    assert unchanged.version == 3


def test_concurrent_update_second_writer_gets_conflict(
    db_session,
    insight_categories,
):
    article = InsightArticle(
        slug="concurrent",
        title="Title",
        excerpt="Excerpt",
        category_id=insight_categories[0].id,
        body_json={
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "Body"}],
                }
            ],
        },
        status="draft",
        published_at=date(2026, 10, 1),
        version=1,
    )
    db_session.add(article)
    db_session.commit()

    other_session = sessionmaker(
        bind=db_session.bind, autocommit=False, autoflush=False
    )()
    try:
        first = db_session.scalar(
            select(InsightArticle).where(InsightArticle.id == article.id)
        )
        second = other_session.scalar(
            select(InsightArticle).where(InsightArticle.id == article.id)
        )
        assert first is not None and second is not None

        update_article(
            db_session,
            first,
            AdminArticleUpdate(version=1, title="First writer"),
        )

        with pytest.raises(VersionConflictError) as exc:
            update_article(
                other_session,
                second,
                AdminArticleUpdate(version=1, title="Second writer"),
            )
        assert exc.value.current_version == 2
    finally:
        other_session.close()

    final = db_session.scalar(
        select(InsightArticle).where(InsightArticle.id == article.id)
    )
    assert final is not None
    assert final.title == "First writer"
    assert final.version == 2
