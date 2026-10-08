"""rename editorial consent fields

Revision ID: 6c416cbee854
Revises: 4e6bd8acae5a
Create Date: 2026-10-07 15:04:11.353854

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "6c416cbee854"
down_revision: str | Sequence[str] | None = "4e6bd8acae5a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Rename consent fields without losing existing data."""
    op.alter_column(
        "businesses",
        "editorial_consent",
        new_column_name="content_use_consent",
    )

    op.alter_column(
        "business_claims",
        "editorial_consent",
        new_column_name="content_use_consent",
    )


def downgrade() -> None:
    """Restore the previous consent field names."""
    op.alter_column(
        "business_claims",
        "content_use_consent",
        new_column_name="editorial_consent",
    )

    op.alter_column(
        "businesses",
        "content_use_consent",
        new_column_name="editorial_consent",
    )
