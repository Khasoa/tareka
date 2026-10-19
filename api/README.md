# tareka API

The tareka API is built with FastAPI and Python. It uses PostgreSQL, SQLAlchemy and Alembic for persistence and database schema migrations.

## Requirements

- Python 3.12 or later.
- uv.
- PostgreSQL.

Run API commands from the `api/` directory unless explicitly noted.

## Local setup

Create a local environment file:

```bash
cp .env.example .env
```

Configure these environment variables in `api/.env`:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLAlchemy database connection URL for PostgreSQL using the installed psycopg driver |
| `SECRET_KEY` | Private secret used by the application's security/session configuration |
| `ENVIRONMENT` | Environment name, such as `development` or `production` |
| `FRONTEND_ORIGIN` | Primary frontend origin allowed by CORS |
| `CORS_ORIGINS` | Optional comma-separated list of additional allowed browser origins |

Use real local credentials in `.env`, and never commit that file. Keep the production secret strong and private.

Install dependencies from the locked project configuration:

```bash
uv sync --all-groups
```

## Database migrations

Apply all available migrations:

```bash
uv run alembic upgrade head
```

Inspect the current database revision:

```bash
uv run alembic current
```

Inspect the available migration heads:

```bash
uv run alembic heads
```

Migrations change the database schema. They do not necessarily load the directory's reference data or business records.

Review the migration files under `alembic/versions/` before making schema changes. Take a database backup before applying risky changes to a production database.

## Run the API

From `api/`:

```bash
uv run uvicorn app.main:app --reload --port 8000
```

The health check is available at:

```text
http://localhost:8000/health
```

The API configuration reads the `.env` file relative to the working directory, so run these commands from `api/`.

## Main functional areas

The API is organized into modules under `app/modules/`:

- `directory/` — public business listings and reference data.
- `suggestions/` — business suggestion submissions.
- `claims/` — profile claim submissions and their admin workflow.
- `admin/` — administrator authentication, verification and submission management.
- `import_/` — CSV import functionality.

The frontend uses the API for public business listings and detail pages, county and material references, claims and suggestions.

## Tests and code checks

From `api/`:

```bash
uv run pytest
uv run ruff check app tests scripts
uv run mypy app
```

If a tool is not installed in the active environment, first confirm it is included in the development dependency group and run `uv sync --all-groups`.

## Initial data and imports

The repository includes:

- `app/modules/directory/seed.py` — reference-data seeding.
- `scripts/run_import.py` — CSV import utility.
- `data/businesses.csv` — business import data.
- `scripts/create_admin.py` — administrator bootstrap script.

These operations are separate from schema migrations.

Before running a seed or import operation, review the current script for its expected invocation, validation rules and repeat-run behaviour. Confirm whether it is safe to rerun; do not assume imports are idempotent. Back up the database before importing or replacing production data.

### Create the initial administrator

Use the repository's `scripts/create_admin.py` bootstrap script rather than inserting an administrator directly into database tables.

From `api/`, inspect the script's current input and invocation requirements, then run it using the supported arguments or prompts:

```bash
sed -n '1,240p' scripts/create_admin.py
uv run python scripts/create_admin.py
```

Create the administrator with a unique, strong password. Do not place production passwords in Git, documentation, or shell commands that may be saved in history. Confirm that the account can sign in and that unauthenticated requests to protected admin endpoints are rejected.

## Production configuration

Set environment variables in the hosting provider rather than committing `.env`.

Before launch:

1. Configure the production PostgreSQL connection and `SECRET_KEY`.
2. Set `ENVIRONMENT` to the intended production value.
3. Set `FRONTEND_ORIGIN` to the canonical frontend origin.
4. Set `CORS_ORIGINS` only to additional origins that genuinely require browser access.
5. Apply migrations with `uv run alembic upgrade head` from the API directory.
6. Create the administrator using the existing bootstrap script.
7. Verify `/health`, directory endpoints, claims and suggestions, admin authentication and database access.
8. Configure database backups and document a restore procedure.

## Deployment

The intended API deployment target is Railway, with `api/` as the service root and PostgreSQL as the production database.

A typical production server command is:

```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
```

Configure the hosting platform's start command and working directory accordingly. Run database migrations explicitly as a deployment step; do not assume starting the web service applies migrations automatically.
