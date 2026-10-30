"""Phase 2 Alembic round-trip tests on a disposable local database only."""

from __future__ import annotations

import os
import subprocess
from collections.abc import Iterator
from datetime import UTC, datetime

import pytest
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import URL, make_url
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.schema import Index

from app.core.config import settings
from app.core.database import Base

DISPOSABLE_DB_NAME = "tareka_phase2_migration_test"
STAGE_A_PARENT = "8b1c0d2e4f6a"
STAGE_A = "a1b2c3d4e5f6"
STAGE_B = "b2c3d4e5f6a7"
PHASE2_SENSITIVE_TABLES = frozenset({"businesses", "business_business_types"})


def _disposable_target_url() -> URL:
    disposable = make_url(settings.database_url).set(database=DISPOSABLE_DB_NAME)
    _require_exact_disposable_database_url(disposable)
    return disposable


def _require_exact_disposable_database_url(url: URL) -> None:
    host = url.host
    if host not in {"localhost", "127.0.0.1"}:
        raise AssertionError(
            "Refusing migration test: database host must be localhost or 127.0.0.1."
        )
    database = url.database
    if not database:
        raise AssertionError("Could not resolve database name from target URL.")
    if database != DISPOSABLE_DB_NAME:
        raise AssertionError(
            "Refusing migration test: resolved database name is "
            f"{database!r}, expected exactly {DISPOSABLE_DB_NAME!r}."
        )


def _render_database_url(url: URL) -> str:
    """Render a connection string for drivers/subprocesses (never log or assert this)."""
    _require_exact_disposable_database_url(url)
    return url.render_as_string(hide_password=False)


def _admin_postgres_url() -> URL:
    return make_url(settings.database_url).set(database="postgres")


def _drop_disposable_database() -> None:
    _require_exact_disposable_database_url(_disposable_target_url())
    admin_engine = create_engine(
        _admin_postgres_url(),
        isolation_level="AUTOCOMMIT",
        hide_parameters=True,
    )
    try:
        with admin_engine.connect() as conn:
            conn.execute(
                text(
                    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
                    "WHERE datname = :name AND pid <> pg_backend_pid()"
                ),
                {"name": DISPOSABLE_DB_NAME},
            )
            conn.execute(text(f'DROP DATABASE IF EXISTS "{DISPOSABLE_DB_NAME}"'))
    finally:
        admin_engine.dispose()


def _create_engine_for_disposable(disposable_url: URL):
    _require_exact_disposable_database_url(disposable_url)
    return create_engine(disposable_url, hide_parameters=True)


def _flatten_compare_entries(diff: object) -> Iterator[object]:
    if isinstance(diff, list):
        for item in diff:
            yield from _flatten_compare_entries(item)
        return
    yield diff


def _compare_entry_table_name(entry: object) -> str | None:
    if not isinstance(entry, tuple) or not entry:
        return None
    kind = entry[0]
    if kind == "add_index" and len(entry) > 1 and isinstance(entry[1], Index):
        return entry[1].table.name
    if kind == "add_table" and len(entry) > 1:
        return getattr(entry[1], "name", None)
    if len(entry) >= 3 and isinstance(entry[2], str):
        return entry[2]
    return None


def _describe_compare_entry(entry: object) -> str:
    if not isinstance(entry, tuple) or not entry:
        return type(entry).__name__
    kind = entry[0]
    if kind == "add_index" and len(entry) > 1 and isinstance(entry[1], Index):
        index = entry[1]
        return f"add_index table={index.table.name!r} index={index.name!r}"
    if len(entry) >= 4 and isinstance(entry[2], str):
        column = (
            entry[3] if isinstance(entry[3], str) else getattr(entry[3], "name", None)
        )
        return f"{kind} table={entry[2]!r} column={column!r}"
    if len(entry) >= 2:
        return str(kind)
    return str(kind)


def _is_known_submitted_at_drift(entry: object) -> bool:
    return (
        isinstance(entry, tuple)
        and len(entry) >= 4
        and entry[0] == "modify_type"
        and entry[2] == "business_claims"
        and entry[3] == "submitted_at"
    )


def _is_known_business_id_index_drift(entry: object) -> bool:
    if not isinstance(entry, tuple) or len(entry) < 2:
        return False
    if entry[0] != "add_index" or not isinstance(entry[1], Index):
        return False
    index = entry[1]
    return (
        index.name == "ix_business_claims_business_id"
        and index.table.name == "business_claims"
    )


def _assert_schema_matches_models(disposable_url: URL) -> None:
    _require_exact_disposable_database_url(disposable_url)
    engine = _create_engine_for_disposable(disposable_url)
    try:
        with engine.connect() as connection:
            context = MigrationContext.configure(connection)
            diff = compare_metadata(context, Base.metadata)
    finally:
        engine.dispose()

    tolerated_labels: list[str] = []
    unexpected: list[str] = []

    for entry in _flatten_compare_entries(diff):
        if _is_known_submitted_at_drift(entry):
            tolerated_labels.append("submitted_at type")
            continue
        if _is_known_business_id_index_drift(entry):
            tolerated_labels.append("ix_business_claims_business_id")
            continue

        description = _describe_compare_entry(entry)
        table = _compare_entry_table_name(entry)
        if table in PHASE2_SENSITIVE_TABLES:
            unexpected.append(f"Phase 2 table drift: {description}")
        else:
            unexpected.append(description)

    if tolerated_labels:
        unique = sorted(set(tolerated_labels))
        print(
            "Known pre-existing claims drift tolerated: " + ", ".join(unique),
            flush=True,
        )

    if unexpected:
        joined = "; ".join(unexpected)
        raise AssertionError(
            "Model metadata does not match migrated schema (unexpected operations): "
            f"{joined}"
        )


def _run_alembic(*args: str, disposable_url: URL) -> None:
    _require_exact_disposable_database_url(disposable_url)
    env = {**os.environ, "DATABASE_URL": _render_database_url(disposable_url)}
    result = subprocess.run(
        ["uv", "run", "alembic", *args],
        cwd=os.path.dirname(os.path.dirname(__file__)),
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise AssertionError(
            f"alembic {' '.join(args)} failed:\n{result.stdout}\n{result.stderr}"
        )


def _recreate_disposable_database() -> URL:
    disposable_url = _disposable_target_url()
    _require_exact_disposable_database_url(disposable_url)

    admin_engine = create_engine(
        _admin_postgres_url(),
        isolation_level="AUTOCOMMIT",
        hide_parameters=True,
    )
    try:
        with admin_engine.connect() as conn:
            conn.execute(
                text(
                    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
                    "WHERE datname = :name AND pid <> pg_backend_pid()"
                ),
                {"name": DISPOSABLE_DB_NAME},
            )
            conn.execute(text(f'DROP DATABASE IF EXISTS "{DISPOSABLE_DB_NAME}"'))
            conn.execute(text(f'CREATE DATABASE "{DISPOSABLE_DB_NAME}"'))
    except SQLAlchemyError as exc:
        admin_engine.dispose()
        pytest.skip(
            "Cannot create disposable database (need CREATEDB or a pre-created "
            f"'{DISPOSABLE_DB_NAME}' database on localhost): "
            f"{exc.__class__.__name__}"
        )
    admin_engine.dispose()

    _require_exact_disposable_database_url(disposable_url)
    return disposable_url


def _seed_legacy_fixtures(disposable_url: URL, engine) -> dict[str, int]:
    _require_exact_disposable_database_url(disposable_url)
    now = datetime.now(UTC)
    ids: dict[str, int] = {}
    with engine.begin() as conn:
        material_id = conn.execute(
            text(
                "INSERT INTO materials (name, slug, parent_id) "
                "VALUES ('Plastic', 'plastic', NULL) RETURNING id"
            )
        ).scalar_one()

        admin_id = conn.execute(
            text(
                """
                INSERT INTO admin_users (
                    email, password_hash, failed_attempts, created_at
                ) VALUES (
                    'migration-test@example.org', 'hash', 0, :now
                ) RETURNING id
                """
            ),
            {"now": now},
        ).scalar_one()

        fixtures = [
            ("legacy-collector", "collector", "yes"),
            ("legacy-aggregator", "aggregator", "unknown"),
            ("legacy-recycler", "recycler", "no"),
            ("legacy-upcycler", "upcycler", "yes"),
            ("legacy-mixed", "mixed", "unknown"),
            ("legacy-unsupported", "invalid_legacy_type", "yes"),
        ]
        for slug, business_type, dropoff in fixtures:
            business_id = conn.execute(
                text(
                    """
                    INSERT INTO businesses (
                        name, slug, business_type, accepts_public_dropoff,
                        verification_status, last_verified_at, is_active,
                        created_at, updated_at
                    ) VALUES (
                        :name, :slug, :business_type, :dropoff,
                        'verified', :verified_at, true, :now, :now
                    ) RETURNING id
                    """
                ),
                {
                    "name": slug.replace("-", " ").title(),
                    "slug": slug,
                    "business_type": business_type,
                    "dropoff": dropoff,
                    "verified_at": now,
                    "now": now,
                },
            ).scalar_one()
            ids[slug] = business_id
            conn.execute(
                text(
                    "INSERT INTO locations (business_id, county, town) "
                    "VALUES (:business_id, 'Nairobi', 'Nairobi')"
                ),
                {"business_id": business_id},
            )
            conn.execute(
                text(
                    "INSERT INTO business_materials (business_id, material_id) "
                    "VALUES (:business_id, :material_id)"
                ),
                {"business_id": business_id, "material_id": material_id},
            )

        conn.execute(
            text(
                """
                INSERT INTO verification_records (
                    business_id, status, verified_at, notes
                ) VALUES (
                    :business_id, 'verified', :verified_at, 'seed record'
                )
                """
            ),
            {"business_id": ids["legacy-collector"], "verified_at": now},
        )

        conn.execute(
            text(
                """
                INSERT INTO audit_log (
                    admin_id, action, entity, entity_id, before, after, at
                ) VALUES (
                    :admin_id, 'seed_migration_fixture', 'business',
                    :entity_id, '{"status":"seed"}'::json, '{"status":"seed"}'::json,
                    :now
                )
                """
            ),
            {
                "admin_id": admin_id,
                "entity_id": ids["legacy-collector"],
                "now": now,
            },
        )

    return ids


def _related_record_counts(conn) -> tuple[int, int, int, int, int]:
    row = conn.execute(
        text(
            """
            SELECT
              (SELECT count(*) FROM businesses) AS businesses,
              (SELECT count(*) FROM materials) AS materials,
              (SELECT count(*) FROM locations) AS locations,
              (SELECT count(*) FROM verification_records) AS verifications,
              (SELECT count(*) FROM audit_log) AS audits
            """
        )
    ).one()
    return (
        row.businesses,
        row.materials,
        row.locations,
        row.verifications,
        row.audits,
    )


def test_disposable_database_url_repr_masks_password():
    configured = make_url(settings.database_url)
    disposable = _disposable_target_url()
    if not configured.password:
        pytest.skip("Configured database URL has no password to verify masking.")
    assert configured.password not in repr(disposable)
    assert configured.password not in str(disposable)


@pytest.fixture(scope="module")
def disposable_database():
    url = _recreate_disposable_database()
    try:
        yield url
    finally:
        _drop_disposable_database()


def test_phase2_migrations_round_trip(disposable_database: URL):
    _require_exact_disposable_database_url(disposable_database)

    _run_alembic("upgrade", STAGE_A_PARENT, disposable_url=disposable_database)
    engine = _create_engine_for_disposable(disposable_database)

    legacy_ids = _seed_legacy_fixtures(disposable_database, engine)

    _run_alembic("upgrade", STAGE_A, disposable_url=disposable_database)
    with engine.connect() as conn:
        pickup_values = conn.execute(
            text("SELECT slug, offers_pickup FROM businesses ORDER BY slug")
        ).all()
        assert all(value == "unknown" for _, value in pickup_values)
        unknown_dropoff = conn.execute(
            text(
                "SELECT accepts_public_dropoff FROM businesses WHERE slug = 'legacy-mixed'"
            )
        ).scalar_one()
        assert unknown_dropoff == "unknown"
        expected_counts = _related_record_counts(conn)

    _run_alembic("upgrade", STAGE_B, disposable_url=disposable_database)
    with engine.connect() as conn:
        for legacy_type, slug in [
            ("collector", "legacy-collector"),
            ("aggregator", "legacy-aggregator"),
            ("recycler", "legacy-recycler"),
            ("upcycler", "legacy-upcycler"),
        ]:
            rows = conn.execute(
                text(
                    "SELECT business_type FROM business_business_types "
                    "WHERE business_id = :id ORDER BY business_type"
                ),
                {"id": legacy_ids[slug]},
            ).all()
            assert [row[0] for row in rows] == [legacy_type]

        mixed_rows = conn.execute(
            text(
                "SELECT count(*) FROM business_business_types WHERE business_id = :id"
            ),
            {"id": legacy_ids["legacy-mixed"]},
        ).scalar_one()
        assert mixed_rows == 0

        unsupported_rows = conn.execute(
            text(
                "SELECT count(*) FROM business_business_types WHERE business_id = :id"
            ),
            {"id": legacy_ids["legacy-unsupported"]},
        ).scalar_one()
        assert unsupported_rows == 0

        conn.execute(
            text(
                "INSERT INTO business_business_types (business_id, business_type) "
                "VALUES (:id, 'aggregator')"
            ),
            {"id": legacy_ids["legacy-recycler"]},
        )
        for extra_type in ("recycler", "upcycler"):
            conn.execute(
                text(
                    "INSERT INTO business_business_types (business_id, business_type) "
                    "VALUES (:id, :business_type) ON CONFLICT DO NOTHING"
                ),
                {"id": legacy_ids["legacy-collector"], "business_type": extra_type},
            )
        conn.commit()

        assert _related_record_counts(conn) == expected_counts

    inspector = inspect(engine)
    assert inspector.has_table("business_business_types")
    assert "offers_pickup" in {
        col["name"] for col in inspector.get_columns("businesses")
    }
    nullable = next(
        col["nullable"]
        for col in inspector.get_columns("businesses")
        if col["name"] == "business_type"
    )
    assert nullable is True

    _run_alembic("downgrade", STAGE_A, disposable_url=disposable_database)
    with engine.connect() as conn:
        assert (
            conn.execute(
                text(
                    "SELECT business_type FROM businesses WHERE slug = 'legacy-aggregator'"
                )
            ).scalar_one()
            == "mixed"
        )
        assert (
            conn.execute(
                text(
                    "SELECT business_type FROM businesses WHERE slug = 'legacy-recycler'"
                )
            ).scalar_one()
            == "recycler"
        )
        assert (
            conn.execute(
                text(
                    "SELECT business_type FROM businesses WHERE slug = 'legacy-collector'"
                )
            ).scalar_one()
            == "collector"
        )
        assert (
            conn.execute(
                text(
                    "SELECT business_type FROM businesses WHERE slug = 'legacy-unsupported'"
                )
            ).scalar_one()
            == "mixed"
        )
        assert (
            conn.execute(
                text("SELECT business_type FROM businesses WHERE slug = 'legacy-mixed'")
            ).scalar_one()
            == "mixed"
        )
        assert _related_record_counts(conn) == expected_counts
    assert not inspect(engine).has_table("business_business_types")
    assert (
        next(
            col["nullable"]
            for col in inspect(engine).get_columns("businesses")
            if col["name"] == "business_type"
        )
        is False
    )

    _run_alembic("upgrade", STAGE_B, disposable_url=disposable_database)
    with engine.connect() as conn:
        assert (
            conn.execute(
                text(
                    "SELECT count(*) FROM business_business_types "
                    "WHERE business_id = :id"
                ),
                {"id": legacy_ids["legacy-recycler"]},
            ).scalar_one()
            == 1
        )
        assert _related_record_counts(conn) == expected_counts

    _assert_schema_matches_models(disposable_database)

    engine.dispose()
