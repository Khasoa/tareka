# Phase 2D — deployment configuration (documentation only)

Do **not** apply these settings from the repository. Configure production through Cloudflare, Vercel, and Railway dashboards.

## Canonical site

- Public site origin: `https://tareka.directory`
- Configure **`www` → apex** redirect in Vercel domain settings (or your DNS/hosting provider). Metadata and sitemap code do not perform this redirect.

## Cloudflare R2 (featured images)

- R2 bucket for Insights featured images.
- Public read access via custom domain **`images.tareka.directory`** (DNS + SSL on Cloudflare).
- Uploaded objects use long-lived cache headers (`Cache-Control: public, max-age=31536000, immutable`) and correct `Content-Type` (set by the API uploader).
- Object keys must remain random and must not be reused.

## Vercel (Next.js frontend)

### Public environment variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | FastAPI base URL (e.g. `https://api.tareka.directory`) |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (`https://tareka.directory`). **Must be set in Vercel before `npm run build`** so metadata, canonical URLs, sitemap, and Open Graph use the production origin (not a preview default). |
| `NEXT_PUBLIC_INSIGHTS_IMAGE_ORIGIN` | Image CDN origin (`https://images.tareka.directory`) |

### Server-only secrets (never `NEXT_PUBLIC_*`)

| Variable | Purpose |
|----------|---------|
| `REVALIDATE_SECRET` | Must match Railway `NEXT_REVALIDATE_SECRET`; authenticates `POST /api/revalidate` |

### Revalidation endpoint

- Railway `NEXT_REVALIDATE_URL` must point to the Vercel route, e.g. `https://tareka.directory/api/revalidate`.
- Request contract (Phase 2A caller):
  - Method: `POST`
  - Header: `Authorization: Bearer <shared secret>`
  - JSON body: `{ "paths": ["/insights", "/insights/<slug>", "/sitemap.xml"], "slug": "<slug>" }`
- Allowed paths: `/insights`, `/insights/<slug>`, `/sitemap.xml` only.

### Caching / ISR

- Public Insights routes use **`revalidate = 60`** seconds as a fallback when on-demand revalidation is unavailable. Article pages call `notFound()` when the public API returns **404** (missing or unpublished slug), which must produce a real **HTTP 404** response.
- Primary publishing path: FastAPI commits → background revalidation task → Next.js `revalidatePath`.

### Images

- `next.config.ts` includes `images.remotePatterns` for `NEXT_PUBLIC_INSIGHTS_IMAGE_ORIGIN` (default `images.tareka.directory`).

## Railway (FastAPI API)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection |
| `NEXT_REVALIDATE_URL` | Full URL to Vercel `/api/revalidate` |
| `NEXT_REVALIDATE_SECRET` | Shared with Vercel `REVALIDATE_SECRET` |
| `NEXT_REVALIDATE_TIMEOUT_SECONDS` | HTTP timeout (default 5) |
| `R2_*` | Account, bucket, credentials, `R2_PUBLIC_BASE_URL` (`https://images.tareka.directory`) |
| `INSIGHT_IMAGE_MAX_BYTES` | Upload size limit |

Ensure request body size limits allow featured-image uploads.

## Verification checklist (post-deploy)

1. Publish an article → appears on `/insights` and `/insights/<slug>` without redeploying the frontend.
2. Edit a published article → public page updates after revalidation.
3. Unpublish → article removed from listing and sitemap; `/insights/<slug>` returns **HTTP 404** (test a previously cached URL).
4. Draft preview stays on `/admin/insights/<id>/preview`, client-fetched with session cookie; not in sitemap or public API.
5. Revalidation failure does not roll back API saves (check API logs only; no secret values logged).
