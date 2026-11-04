"""Insights editorial CMS tables

Revision ID: c4d5e6f7a8b9
Revises: b2c3d4e5f6a7
Create Date: 2026-11-02 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "c4d5e6f7a8b9"
down_revision: str | Sequence[str] | None = "b2c3d4e5f6a7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "insight_categories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )

    op.create_table(
        "insight_articles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("slug", sa.String(length=220), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False, server_default=""),
        sa.Column("excerpt", sa.Text(), nullable=False, server_default=""),
        sa.Column("category_id", sa.Integer(), nullable=True),
        sa.Column("body_json", sa.JSON(), nullable=False),
        sa.Column(
            "status", sa.String(length=20), nullable=False, server_default="draft"
        ),
        sa.Column("published_at", sa.Date(), nullable=True),
        sa.Column("featured_image_key", sa.String(length=500), nullable=True),
        sa.Column("featured_image_alt", sa.String(length=300), nullable=True),
        sa.Column("featured_image_caption", sa.String(length=500), nullable=True),
        sa.Column("seo_title", sa.String(length=300), nullable=True),
        sa.Column("meta_description", sa.String(length=500), nullable=True),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint(
            "status IN ('draft', 'published')",
            name="ck_insight_articles_status",
        ),
        sa.CheckConstraint(
            "(status <> 'published') OR (published_at IS NOT NULL)",
            name="ck_insight_articles_published_requires_date",
        ),
        sa.ForeignKeyConstraint(["category_id"], ["insight_categories.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index(
        "ix_insight_articles_status_published_at",
        "insight_articles",
        ["status", "published_at"],
        unique=False,
    )

    connection = op.get_bind()
    connection.execute(
        sa.text(
            """
            INSERT INTO insight_categories (slug, name, sort_order, is_active)
            VALUES
                ('foundations', 'Foundations', 1, true),
                ('recovery-in-practice', 'Recovery in Practice', 2, true),
                ('material-explorations', 'Material Explorations', 3, true)
            ON CONFLICT (slug) DO NOTHING
            """
        )
    )


def downgrade() -> None:
    op.drop_index(
        "ix_insight_articles_status_published_at", table_name="insight_articles"
    )
    op.drop_table("insight_articles")
    op.drop_table("insight_categories")
