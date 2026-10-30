"""add offers_pickup to businesses

Revision ID: a1b2c3d4e5f6
Revises: 8b1c0d2e4f6a
Create Date: 2026-10-29 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: str | Sequence[str] | None = "8b1c0d2e4f6a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "businesses",
        sa.Column(
            "offers_pickup",
            sa.String(length=20),
            nullable=False,
            server_default="unknown",
        ),
    )
    op.alter_column("businesses", "offers_pickup", server_default=None)


def downgrade() -> None:
    op.drop_column("businesses", "offers_pickup")
