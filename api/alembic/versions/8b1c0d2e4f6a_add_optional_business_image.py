"""add optional business image url

Revision ID: 8b1c0d2e4f6a
Revises: 6c416cbee854
Create Date: 2026-10-16 15:20:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "8b1c0d2e4f6a"
down_revision: str | Sequence[str] | None = "6c416cbee854"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "businesses", sa.Column("image_url", sa.String(length=500), nullable=True)
    )
    op.add_column(
        "businesses", sa.Column("image_alt", sa.String(length=200), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("businesses", "image_alt")
    op.drop_column("businesses", "image_url")
