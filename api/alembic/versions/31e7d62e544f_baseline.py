"""baseline

Revision ID: 31e7d62e544f
Revises:
Create Date: 2026-09-28 02:39:00.907953

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "31e7d62e544f"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""


def downgrade() -> None:
    """Downgrade schema."""
