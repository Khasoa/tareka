# tareka frontend

The tareka web application is built with Next.js App Router, React, TypeScript and Tailwind CSS.

## Requirements

- Node.js compatible with the installed Next.js release.
- npm.

Use the committed `package-lock.json` to install reproducible dependencies.

## Local setup

From the repository root:

```bash
cd web
cp .env.example .env
```

Configure the local environment:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NEXT_PUBLIC_API_URL` must be the API origin, not an endpoint path. The client builds requests to routes such as `/businesses` and `/directory/materials`.

`NEXT_PUBLIC_SITE_URL` is the canonical frontend origin used for metadata and sitemap URLs. It must be set to the real canonical origin in production.

Install dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:3000`. The FastAPI service must also be running for API-backed directory functionality to work.

## Available commands

```bash
npm run dev       # Start the development server
npm run lint      # Run ESLint
npm run build     # Build the production application
npm run start     # Serve a completed production build
npm audit         # Review dependency security advisories
npm audit --omit=dev
```

Run `npm run build` before deploying. A successful build does not replace testing against the production API and database.

## Main routes

- `/` — primary directory homepage.
- `/directory` — directory route and query-parameter handling.
- `/directory/[slug]` — public business profiles.
- `/directory/[slug]/claim` — business claim submission.
- `/how-it-works` — explanation of the directory.
- `/suggest` — business suggestion form.
- `/insights` — editorial content listing.
- `/insights/[slug]` — individual Insight articles.
- `/admin` and related admin routes — authenticated administration.
- `/robots.txt` — crawler instructions.
- `/sitemap.xml` — public URL discovery.

Admin routes must be protected by actual authentication and authorization. Disallowing a route in `robots.txt` does not make it private.

## API connection

The API client is in `src/lib/api.ts`. It uses `NEXT_PUBLIC_API_URL` as its base URL and applies a request timeout.

The frontend expects the API to provide directory data, business details, county and material reference data, and the submission endpoints used by suggestion and claim forms.

For local development, run the API on port 8000 unless the frontend environment is configured for another origin.

## Insights publishing

The Insights library reads `.mdx` files from `content/insights/` relative to the frontend project root.

Create an article at `content/insights/<slug>.mdx`, using frontmatter fields supported by `src/lib/insights.ts`:

```md
---
title: "A descriptive article title"
slug: "example-article"
excerpt: "A concise summary of the article."
category: "Recycling"
published_at: "2026-10-17"
---

Article content goes here.
```

The slug must use lowercase letters, numbers and hyphens and must match the filename. The publication date must use `YYYY-MM-DD` and be a valid calendar date.

Optional cover images use a path beginning with `/images/insights/`. When a cover image is supplied, provide meaningful `image_alt` text as required by the Insights validator.

Preview the article locally, check links and imagery, and run the production build before publishing. Adding or changing content requires the relevant deployment/rebuild workflow.

## SEO and production configuration

The application generates `robots.txt` and `sitemap.xml`.

Set the following variables in the Vercel project before the production build:

- `NEXT_PUBLIC_SITE_URL` — canonical frontend origin, for example `https://your-chosen-domain.example`.
- `NEXT_PUBLIC_API_URL` — production API origin, for example `https://your-api-service.example`.

Replace these examples with the actual origins. Do not deploy the example domains.

The sitemap contains configured public static pages and Insights articles. It also requests public business slugs from the API. If the API is unavailable, the sitemap should still return its static pages and articles, but business profile URLs may be missing until the API is available again.

After changing production environment variables, rebuild/redeploy the frontend. Verify the actual deployed `https://your-domain/robots.txt` and `https://your-domain/sitemap.xml` rather than relying only on a local build.

## Deployment

Configure the Vercel project to use `web/` as its root directory. Use the package scripts defined in `package.json`; the standard production build command is:

```bash
npm run build
```

Before launch, verify the deployed frontend can reach the production API, that browser requests are allowed by API CORS settings, and that the canonical URL and metadata point to the intended domain.
