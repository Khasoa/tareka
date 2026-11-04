import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import {
  fetchAllPublishedInsightSummaries,
  fetchPublishedInsightBySlug,
  isValidInsightSlug,
  PublicInsightsApiError,
} from "@/lib/publicInsightsApi";

describe("publicInsightsApi", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000");
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  it("validates insight slugs", () => {
    expect(isValidInsightSlug("waste-hierarchy-kenya")).toBe(true);
    expect(isValidInsightSlug("../admin")).toBe(false);
  });

  it("returns null for unpublished or missing articles (404)", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 404,
      ok: false,
    }) as typeof fetch;

    const article = await fetchPublishedInsightBySlug("missing-slug", {
      revalidate: false,
    });
    expect(article).toBeNull();
  });

  it("throws on API server errors so ISR can keep the last good page", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 503,
      ok: false,
    }) as typeof fetch;

    await expect(
      fetchPublishedInsightBySlug("published-slug", { revalidate: false }),
    ).rejects.toThrow(PublicInsightsApiError);
  });

  it("throws when the API request fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network")) as typeof fetch;

    await expect(
      fetchPublishedInsightBySlug("published-slug", { revalidate: false }),
    ).rejects.toThrow(PublicInsightsApiError);
  });

  it("parses published list responses and paginates", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              slug: "first",
              title: "First",
              excerpt: "Excerpt",
              category: "Foundations",
              published_at: "2026-01-01",
              featured_image_url: null,
              featured_image_alt: null,
              featured_image_caption: null,
              seo_title: null,
              meta_description: null,
            },
          ],
          page: 1,
          page_size: 50,
          total: 1,
          total_pages: 1,
        }),
      }) as typeof fetch;

    const items = await fetchAllPublishedInsightSummaries({ revalidate: false });
    expect(items).toHaveLength(1);
    expect(items[0]?.slug).toBe("first");
  });

  it("returns an empty list when the API is unavailable", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network")) as typeof fetch;
    const items = await fetchAllPublishedInsightSummaries({ revalidate: false });
    expect(items).toEqual([]);
  });
});
