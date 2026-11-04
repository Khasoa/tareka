from datetime import UTC, date, datetime

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

ARTICLE_STATUSES = ("draft", "published")


class InsightCategory(Base):
    __tablename__ = "insight_categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    articles: Mapped[list["InsightArticle"]] = relationship(back_populates="category")


class InsightArticle(Base):
    __tablename__ = "insight_articles"
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'published')",
            name="ck_insight_articles_status",
        ),
        CheckConstraint(
            "(status <> 'published') OR (published_at IS NOT NULL)",
            name="ck_insight_articles_published_requires_date",
        ),
        Index("ix_insight_articles_status_published_at", "status", "published_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(220), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False, default="")
    excerpt: Mapped[str] = mapped_column(Text, nullable=False, default="")
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("insight_categories.id"), nullable=True
    )
    body_json: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    published_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    featured_image_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    featured_image_alt: Mapped[str | None] = mapped_column(String(300), nullable=True)
    featured_image_caption: Mapped[str | None] = mapped_column(
        String(500), nullable=True
    )
    seo_title: Mapped[str | None] = mapped_column(String(300), nullable=True)
    meta_description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    category: Mapped[InsightCategory | None] = relationship(back_populates="articles")
