import { getPublicApiBaseUrl } from "@/lib/apiOrigin";

/** ISR fallback when on-demand revalidation is unavailable. */
export const PUBLIC_INSIGHTS_ISR_SECONDS = 60;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type PublicInsightSummary = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  published_at: string;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  featured_image_caption: string | null;
  seo_title: string | null;
  meta_description: string | null;
};

export type PublicInsightDetail = PublicInsightSummary & {
  body_json: Record<string, unknown>;
};

type PublicInsightListResponse = {
  items: PublicInsightSummary[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSummary(value: unknown): PublicInsightSummary | null {
  if (!isRecord(value)) return null;
  if (typeof value.slug !== "string" || !SLUG_PATTERN.test(value.slug)) return null;
  if (typeof value.title !== "string") return null;
  if (typeof value.excerpt !== "string") return null;
  if (typeof value.category !== "string") return null;
  if (typeof value.published_at !== "string") return null;

  return {
    slug: value.slug,
    title: value.title,
    excerpt: value.excerpt,
    category: value.category,
    published_at: value.published_at,
    featured_image_url:
      typeof value.featured_image_url === "string" ? value.featured_image_url : null,
    featured_image_alt:
      typeof value.featured_image_alt === "string" ? value.featured_image_alt : null,
    featured_image_caption:
      typeof value.featured_image_caption === "string"
        ? value.featured_image_caption
        : null,
    seo_title: typeof value.seo_title === "string" ? value.seo_title : null,
    meta_description:
      typeof value.meta_description === "string" ? value.meta_description : null,
  };
}

function parseDetail(value: unknown): PublicInsightDetail | null {
  const summary = parseSummary(value);
  if (!summary || !isRecord(value) || !isRecord(value.body_json)) {
    return null;
  }
  if (value.body_json.type !== "doc") {
    return null;
  }
  return {
    ...summary,
    body_json: value.body_json,
  };
}

function parseListResponse(value: unknown): PublicInsightListResponse | null {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    return null;
  }

  const items = value.items
    .map((item) => parseSummary(item))
    .filter((item): item is PublicInsightSummary => item !== null);

  if (
    typeof value.page !== "number" ||
    typeof value.page_size !== "number" ||
    typeof value.total !== "number" ||
    typeof value.total_pages !== "number"
  ) {
    return null;
  }

  return {
    items,
    page: value.page,
    page_size: value.page_size,
    total: value.total,
    total_pages: value.total_pages,
  };
}

export function isValidInsightSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

/** Thrown when the public Insights API is unreachable or returns a non-404 error. */
export class PublicInsightsApiError extends Error {
  readonly status: number | undefined;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "PublicInsightsApiError";
    this.status = status;
  }
}

type FetchInsightsOptions = {
  revalidate?: number | false;
};

export async function fetchPublishedInsightSummariesPage(
  page: number,
  pageSize = 50,
  options?: FetchInsightsOptions,
): Promise<PublicInsightListResponse | null> {
  const apiUrl = getPublicApiBaseUrl();
  if (!apiUrl) {
    return null;
  }

  const revalidate = options?.revalidate ?? PUBLIC_INSIGHTS_ISR_SECONDS;

  let response: Response;
  try {
    response = await fetch(
      `${apiUrl}/api/insights?page=${page}&page_size=${pageSize}`,
      revalidate === false
        ? { cache: "no-store" }
        : { next: { revalidate } },
    );
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  try {
    const payload: unknown = await response.json();
    return parseListResponse(payload);
  } catch {
    return null;
  }
}

export async function fetchAllPublishedInsightSummaries(
  options?: FetchInsightsOptions,
): Promise<PublicInsightSummary[]> {
  const first = await fetchPublishedInsightSummariesPage(1, 50, options);
  if (!first) {
    return [];
  }

  const items = [...first.items];
  const totalPages = Math.max(1, first.total_pages);

  for (let page = 2; page <= totalPages; page += 1) {
    const next = await fetchPublishedInsightSummariesPage(page, 50, options);
    if (!next) {
      break;
    }
    items.push(...next.items);
  }

  return items;
}

export async function fetchPublishedInsightBySlug(
  slug: string,
  options?: FetchInsightsOptions,
): Promise<PublicInsightDetail | null> {
  if (!isValidInsightSlug(slug)) {
    return null;
  }

  const apiUrl = getPublicApiBaseUrl();
  if (!apiUrl) {
    throw new PublicInsightsApiError("NEXT_PUBLIC_API_URL is not configured.");
  }

  const revalidate = options?.revalidate ?? PUBLIC_INSIGHTS_ISR_SECONDS;

  let response: Response;
  try {
    response = await fetch(`${apiUrl}/api/insights/${encodeURIComponent(slug)}`, {
      ...(revalidate === false
        ? { cache: "no-store" }
        : { next: { revalidate } }),
    });
  } catch (cause) {
    throw new PublicInsightsApiError(
      cause instanceof Error ? cause.message : "Insights API request failed.",
    );
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new PublicInsightsApiError(
      `Insights API responded with ${response.status}.`,
      response.status,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new PublicInsightsApiError("Insights API returned invalid JSON.");
  }

  const detail = parseDetail(payload);
  if (!detail) {
    throw new PublicInsightsApiError(
      "Insights API returned an invalid article payload.",
    );
  }
  return detail;
}
