"""multi-value business types association

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-10-29 00:10:00.000000

Stage B migration — review before applying to databases that hold data
you need to keep.

Downgrade is lossy: multi-type businesses collapse to a single legacy
``business_type`` value. The pre-Stage-B schema allowed ``collector``,
``recycler``, ``upcycler``, and ``mixed`` only — not ``aggregator``.
Rollback maps association rows to the first matching type in order
collector → recycler → upcycler; businesses whose types are not in that
set (including aggregator-only) become ``mixed``. Every business with
zero association rows becomes ``mixed``, regardless of the legacy column.

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "b2c3d4e5f6a7"
down_revision: str | Sequence[str] | None = "a1b2c3d4e5f6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

CANONICAL = ("collector", "aggregator", "recycler", "upcycler")
LEGACY_ROLLBACK_ORDER = ("collector", "recycler", "upcycler")
MIXED = "mixed"


def upgrade() -> None:
    op.create_table(
        "business_business_types",
        sa.Column("business_id", sa.Integer(), nullable=False),
        sa.Column("business_type", sa.String(length=30), nullable=False),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("business_id", "business_type"),
        sa.CheckConstraint(
            "business_type IN ('collector', 'aggregator', 'recycler', 'upcycler')",
            name="ck_business_business_types_allowed",
        ),
    )

    connection = op.get_bind()

    rows = connection.execute(
        sa.text("SELECT id, business_type FROM businesses")
    ).fetchall()

    for business_id, legacy_type in rows:
        normalized = (legacy_type or "").strip().lower()
        if normalized in CANONICAL:
            connection.execute(
                sa.text(
                    "INSERT INTO business_business_types (business_id, business_type) "
                    "VALUES (:business_id, :business_type)"
                ),
                {"business_id": business_id, "business_type": normalized},
            )
        # legacy `mixed` and unknown values: no association rows (unresolved).

    op.alter_column(
        "businesses", "business_type", existing_type=sa.String(30), nullable=True
    )


def downgrade() -> None:
    connection = op.get_bind()

    business_ids_with_types = [
        row[0]
        for row in connection.execute(
            sa.text("SELECT DISTINCT business_id FROM business_business_types")
        ).fetchall()
    ]

    for business_id in business_ids_with_types:
        types = [
            row[0]
            for row in connection.execute(
                sa.text(
                    "SELECT business_type FROM business_business_types "
                    "WHERE business_id = :business_id"
                ),
                {"business_id": business_id},
            ).fetchall()
        ]
        type_set = set(types)
        chosen = MIXED
        for candidate in LEGACY_ROLLBACK_ORDER:
            if candidate in type_set:
                chosen = candidate
                break
        connection.execute(
            sa.text("UPDATE businesses SET business_type = :legacy WHERE id = :id"),
            {"legacy": chosen, "id": business_id},
        )

    zero_row_businesses = connection.execute(
        sa.text(
            """
            SELECT b.id FROM businesses b
            WHERE NOT EXISTS (
                SELECT 1 FROM business_business_types t WHERE t.business_id = b.id
            )
            """
        )
    ).fetchall()
    for (business_id,) in zero_row_businesses:
        connection.execute(
            sa.text("UPDATE businesses SET business_type = :legacy WHERE id = :id"),
            {"legacy": MIXED, "id": business_id},
        )

    op.drop_table("business_business_types")
    op.alter_column(
        "businesses",
        "business_type",
        existing_type=sa.String(30),
        nullable=False,
    )
