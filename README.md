# tareka

tareka is a directory for discovering recycling, recovery and upcycling businesses in Kenya.

Its purpose is to help people find where to take their waste and discover businesses turning recovered materials into something new.

tareka is a curated public directory, not a marketplace. Public listings, business verification, suggestions and claims are managed through a separate API and admin workflow.

## Product scope

The current product includes:

- A public directory of recovery businesses.
- Directory search and filters for available business, location and material information.
- Individual business profiles.
- Business suggestion and profile-claim workflows.
- An admin area for reviewing submissions and managing verification.
- Editorial Insights content.
- Public SEO routes, including `robots.txt` and `sitemap.xml`.


## Architecture

- **Frontend:** Next.js App Router, React, TypeScript and Tailwind CSS.
- **API:** FastAPI and Python.
- **Database:** PostgreSQL.
- **ORM and migrations:** SQLAlchemy and Alembic.
- **Python dependency management:** uv.
- **API tests:** pytest.
- **Frontend quality checks:** ESLint and the Next.js production build.

The frontend communicates with the API over HTTP. API endpoints, rather than frontend components, are responsible for server-side business logic and database access.

## Repository structure

```text
tareka/
├── README.md
├── web/
│   ├── src/app/             # Next.js routes and layouts
│   ├── src/components/      # Reusable interface components
│   ├── src/lib/             # API client, Insights and shared utilities
│   ├── content/insights/    # MDX article content, when present
│   ├── public/              # Public static assets
│   ├── package.json
│   └── .env.example
└── api/
    ├── app/
    │   ├── core/            # Configuration, database and shared utilities
    │   └── modules/         # Directory, claims, suggestions and admin
    ├── alembic/             # Database migrations
    ├── scripts/             # Admin and data-import utilities
    ├── data/                # Business import data
    ├── tests/
    ├── pyproject.toml
    ├── uv.lock
    └── .env.example
```

## Requirements

Install the following before starting local development:

- Node.js supported by the installed Next.js version and npm.
- Python 3.12 or later.
- uv.
- A running PostgreSQL database.

## Local development

### 1. Configure the API

Open a terminal at the repository root:

```bash
cd api
cp .env.example .env
```

Edit `api/.env` with your local database connection and development settings. At minimum, configure the required `DATABASE_URL` and `SECRET_KEY`.

Install the locked project dependencies:

```bash
uv sync --all-groups
```

Apply database schema migrations:

```bash
uv run alembic upgrade head
```

Start the API:

```bash
uv run uvicorn app.main:app --reload --port 8000
```

The API health endpoint is available at `http://localhost:8000/health`.

### 2. Configure the frontend

In another terminal:

```bash
cd web
cp .env.example .env
```

Set these local values in `web/.env`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

The API URL should be the API origin, without a trailing path such as `/businesses`.

Install the frontend dependencies and start the development server:

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

Keep both the API and frontend terminals running while using the local site.

### 3. Initial and imported data

Database migrations create or update the schema; they do not necessarily populate all reference data or import business records.

The API repository contains reference-data and CSV-import utilities. Before using them, review their current invocation, expected input format and repeat-run behaviour. Do not assume an import is safe to repeat without checking whether it can create duplicate records.

## Checks

From `web/`:

```bash
npm run lint
npm run build
npm audit
```

From `api/`:

```bash
uv run pytest
uv run ruff check app tests scripts
uv run alembic heads
uv run alembic current
```

Run the frontend production build before deployment. Run the API tests and migration checks after changes to backend code or schema.

## Deployment overview

The intended deployment arrangement is:

- **Frontend:** Vercel, with `web/` as the project root.
- **API:** Railway, with `api/` as the service root.
- **Database:** a production PostgreSQL instance.

Before launch:

1. Configure the production environment variables on the relevant platforms.
2. Set `NEXT_PUBLIC_SITE_URL` to the chosen canonical frontend origin and `NEXT_PUBLIC_API_URL` to the production API origin.
3. Configure API CORS to allow only the required frontend origins.
4. Apply Alembic migrations to the production database.
5. Create the initial administrator using the existing API bootstrap script.
6. Verify the health endpoint, public directory, claims and suggestion workflows, and admin authentication.
7. Check the deployed `robots.txt` and `sitemap.xml`.
8. Confirm database backups, a recovery procedure and the final domain/HTTPS configuration.

See `web/README.md` and `api/README.md` for the component-specific instructions.

## Security

- Never commit `.env` files, credentials, session secrets or database passwords.
- Keep the production `SECRET_KEY` private and strong.
- Restrict CORS to the actual application origins.
- Protect admin functionality with backend authentication and authorization. `robots.txt` is not a security control.
- Back up production data before performing data imports or risky schema changes.
