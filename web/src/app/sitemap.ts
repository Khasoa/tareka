import type { MetadataRoute } from "next";

import { getPublicApiBaseUrl } from "@/lib/apiOrigin";
import { fetchAllPublishedInsightSummaries } from "@/lib/publicInsightsApi";
import { getSiteOrigin } from "@/lib/siteOrigin";

export const revalidate = 3600;

const PAGE_SIZE = 50;

// Leave room for static pages and articles within the sitemap URL limit.
const MAX_BUSINESS_PAGES = 900;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function getPublicBusinessSlugs(): Promise<string[]> {
  const apiUrl = getPublicApiBaseUrl();

  if (!apiUrl) {
    return [];
  }

  const slugs = new Set<string>();
  let totalPages = 1;

  for (
    let page = 1;
    page <= totalPages && page <= MAX_BUSINESS_PAGES;
    page += 1
  ) {
    let response: Response;

    try {
      response = await fetch(
        `${apiUrl}/businesses?page=${page}&page_size=${PAGE_SIZE}`,
        {
          next: { revalidate: 3600 },
          signal: AbortSignal.timeout(5000),
        },
      );
    } catch {
      // Do not make sitemap generation fail when the API is unavailable.
      break;
    }

    if (!response.ok) {
      break;
    }

    let payload: unknown;

    try {
      payload = await response.json();
    } catch {
      break;
    }

    if (!isRecord(payload) || !Array.isArray(payload.items)) {
      break;
    }

    if (page === 1) {
      const reportedPages = payload.total_pages;

      if (
        typeof reportedPages === "number" &&
        Number.isInteger(reportedPages) &&
        reportedPages >= 0
      ) {
        totalPages = Math.max(
          1,
          Math.min(reportedPages, MAX_BUSINESS_PAGES),
        );
      }
    }

    for (const item of payload.items) {
      if (!isRecord(item) || typeof item.slug !== "string") {
        continue;
      }

      if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)) {
        slugs.add(item.slug);
      }
    }
  }

  return [...slugs];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteOrigin = getSiteOrigin();

  const pages: MetadataRoute.Sitemap = [
    { url: siteOrigin, changeFrequency: "weekly", priority: 1 },
    {
      url: `${siteOrigin}/how-it-works`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteOrigin}/insights`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteOrigin}/intro`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteOrigin}/suggest`,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${siteOrigin}/privacy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteOrigin}/terms`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const insightArticles = await fetchAllPublishedInsightSummaries({
    revalidate: 3600,
  });

  for (const insight of insightArticles) {
    pages.push({
      url: `${siteOrigin}/insights/${insight.slug}`,
      lastModified: new Date(`${insight.published_at}T00:00:00Z`),
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  const businessSlugs = await getPublicBusinessSlugs();

  for (const slug of businessSlugs) {
    pages.push({
      url: `${siteOrigin}/directory/${slug}`,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return pages;
}
