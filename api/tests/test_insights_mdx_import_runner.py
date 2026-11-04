from __future__ import annotations

from pathlib import Path

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base
from app.modules.insights import models as _insight_models  # noqa: F401
from app.modules.insights.mdx_import.paths import (
    DEFAULT_CONTENT_DIR,
    DEFAULT_PUBLIC_DIR,
)
from app.modules.insights.mdx_import.runner import (
    import_mdx_articles,
    seed_insight_categories,
)
from app.modules.insights.models import InsightArticle


@pytest.fixture
def sqlite_session():
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def content_dir(tmp_path: Path) -> Path:
    target = tmp_path / "insights"
    target.mkdir()
    for name in DEFAULT_CONTENT_DIR.glob("*.mdx"):
        (target / name.name).write_text(
            name.read_text(encoding="utf-8"), encoding="utf-8"
        )
    return target


def test_import_creates_published_articles(
    sqlite_session: Session, content_dir: Path, tmp_path: Path
):
    seed_insight_categories(sqlite_session)
    sqlite_session.commit()

    report = import_mdx_articles(
        sqlite_session,
        content_dir=content_dir,
        public_dir=tmp_path / "public",
        dry_run=False,
        confirm_overwrite_existing=False,
        upload_images=False,
    )

    assert len(report.discovered_files) == 2
    assert all(item.status == "imported" for item in report.results)

    slugs = {row.slug for row in sqlite_session.scalars(select(InsightArticle)).all()}
    assert slugs == {"waste-hierarchy-kenya", "its-not-just-about-waste"}

    article = sqlite_session.scalar(
        select(InsightArticle).where(InsightArticle.slug == "waste-hierarchy-kenya")
    )
    assert article is not None
    assert article.status == "published"
    assert article.seo_title == "The Waste Hierarchy in Kenya: What It Means"
    assert article.body_json["type"] == "doc"
    assert len(article.body_json.get("content") or []) > 5


def test_duplicate_import_is_skipped(
    sqlite_session: Session, content_dir: Path, tmp_path: Path
):
    seed_insight_categories(sqlite_session)
    sqlite_session.commit()

    import_mdx_articles(
        sqlite_session,
        content_dir=content_dir,
        public_dir=tmp_path / "public",
        dry_run=False,
        confirm_overwrite_existing=False,
        upload_images=False,
    )

    second = import_mdx_articles(
        sqlite_session,
        content_dir=content_dir,
        public_dir=tmp_path / "public",
        dry_run=False,
        confirm_overwrite_existing=False,
        upload_images=False,
    )

    assert all(item.status == "skipped_conflict" for item in second.results)
    total = len(sqlite_session.scalars(select(InsightArticle)).all())
    assert total == 2


def test_offline_dry_run_does_not_require_database(content_dir: Path):
    report = import_mdx_articles(
        None,
        content_dir=content_dir,
        public_dir=DEFAULT_PUBLIC_DIR,
        dry_run=True,
        confirm_overwrite_existing=False,
        upload_images=False,
    )
    assert len(report.results) == 2
    assert all(item.status == "dry_run_ready" for item in report.results)
