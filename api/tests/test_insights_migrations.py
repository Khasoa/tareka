"""Alembic upgrade/downgrade for Insights CMS tables on disposable DB only."""

from __future__ import annotations

import os
import subprocess

import pytest
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import URL, make_url
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings

DISPOSABLE_DB_NAME = "tareka_insights_migration_test"


def _disposable_target_url() -> URL:
    disposable = make_url(settings.database_url).set(database=DISPOSABLE_DB_NAME)
    _require_exact_disposable_database_url(disposable)
    return disposable


def _require_exact_disposable_database_url(url: URL) -> None:
    host = url.host
    if host not in {"localhost", "127.0.0.1"}:
        pytest.skip("Migration test requires a local PostgreSQL database.")
    database = url.database
    if not database:
        pytest.fail("Could not resolve database name from target URL.")
    if database != DISPOSABLE_DB_NAME:
        pytest.fail(
            "Refusing migration test: resolved database name is "
            f"{database!r}, expected exactly {DISPOSABLE_DB_NAME!r}."
        )


def _render_database_url(url: URL) -> str:
    """Connection string for drivers/subprocesses (never log or assert this value)."""
    _require_exact_disposable_database_url(url)
    return url.render_as_string(hide_password=False)


def _assert_session_database_name(connection_url: str) -> None:
    engine = create_engine(connection_url, hide_parameters=True)
    try:
        with engine.connect() as connection:
            current = connection.execute(text("SELECT current_database()")).scalar_one()
            if current != DISPOSABLE_DB_NAME:
                pytest.fail(
                    "Refusing migration test: connected database is "
                    f"{current!r}, expected exactly {DISPOSABLE_DB_NAME!r}."
                )
    except SQLAlchemyError as exc:
        pytest.skip(
            f"Pre-created disposable database {DISPOSABLE_DB_NAME!r} is not reachable "
            f"({exc.__class__.__name__}). Create it locally before running this test."
        )
    finally:
        engine.dispose()


@pytest.fixture(scope="module")
def disposable_database() -> URL:
    url = _disposable_target_url()
    connection_url = _render_database_url(url)
    _assert_session_database_name(connection_url)
    return url


def _run_alembic(*args: str, env: dict[str, str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["uv", "run", "alembic", *args],
        check=False,
        capture_output=True,
        text=True,
        cwd=os.path.join(os.path.dirname(__file__), ".."),
        env=env,
    )


def test_insights_migration_upgrade_downgrade_cycle(disposable_database: URL) -> None:
    _require_exact_disposable_database_url(disposable_database)
    connection_url = _render_database_url(disposable_database)
    _assert_session_database_name(connection_url)

    env = os.environ.copy()
    env["DATABASE_URL"] = connection_url

    upgrade = _run_alembic("upgrade", "head", env=env)
    assert upgrade.returncode == 0, upgrade.stderr

    engine = create_engine(connection_url, hide_parameters=True)
    _assert_session_database_name(connection_url)
    inspector = inspect(engine)
    assert "insight_categories" in inspector.get_table_names()
    assert "insight_articles" in inspector.get_table_names()

    with engine.connect() as connection:
        current = connection.execute(text("SELECT current_database()")).scalar_one()
        assert current == DISPOSABLE_DB_NAME

        count = connection.execute(
            text("SELECT COUNT(*) FROM insight_categories")
        ).scalar_one()
        assert count == 3

        invalid = connection.execute(
            text(
                "SELECT id FROM insight_articles "
                "WHERE status = 'published' AND published_at IS NULL"
            )
        ).fetchall()
        assert invalid == []

    downgrade = _run_alembic("downgrade", "-1", env=env)
    assert downgrade.returncode == 0, downgrade.stderr

    inspector = inspect(engine)
    assert "insight_articles" not in inspector.get_table_names()

    reupgrade = _run_alembic("upgrade", "head", env=env)
    assert reupgrade.returncode == 0, reupgrade.stderr

    with engine.connect() as connection:
        current = connection.execute(text("SELECT current_database()")).scalar_one()
        assert current == DISPOSABLE_DB_NAME
        version = connection.execute(
            text("SELECT version_num FROM alembic_version")
        ).scalar_one()
        assert version == "c4d5e6f7a8b9"

    engine.dispose()
