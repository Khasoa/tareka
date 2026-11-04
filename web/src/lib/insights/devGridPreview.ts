import type { PublicInsightSummary } from "@/lib/publicInsightsApi";

const BASE: PublicInsightSummary = {
  slug: "preview-base",
  title: "Short title",
  excerpt: "A brief excerpt for layout testing.",
  category: "Foundations",
  published_at: "2025-11-01",
  featured_image_url: null,
  featured_image_alt: null,
  featured_image_caption: null,
  seo_title: null,
  meta_description: null,
};

function clone(partial: Partial<PublicInsightSummary>, index: number): PublicInsightSummary {
  return {
    ...BASE,
    ...partial,
    slug: partial.slug ?? `preview-${index}`,
    published_at:
      partial.published_at ??
      `2025-${String(10 - Math.min(index, 9)).padStart(2, "0")}-15`,
  };
}

/** Dev-only mock sets for /insights?devInsightsGrid=0|1|2|8 */
export function devInsightsGridPreview(
  mode: string | null,
  fallback: PublicInsightSummary[],
): PublicInsightSummary[] | null {
  if (process.env.NODE_ENV !== "development" || !mode) {
    return null;
  }

  switch (mode) {
    case "0":
      return [];
    case "1":
      return [
        clone(
          {
            title: "Single article with a featured image",
            excerpt: "One card only — no wide span.",
            category: "Recovery in Practice",
            featured_image_url: "/images/materials/paper.webp",
            featured_image_alt: "Placeholder collage poster",
          },
          0,
        ),
      ];
    case "2":
      return [
        clone(
          {
            title: "Newest of two",
            category: "Material Explorations",
            featured_image_url: "/images/materials/glass.webp",
            featured_image_alt: "Blue placeholder",
          },
          0,
        ),
        clone(
          {
            title: "Second article without an image",
            category: "Foundations",
            excerpt: "Fallback fill with large numeral.",
          },
          1,
        ),
      ];
    case "8":
      return Array.from({ length: 8 }, (_, index) =>
        clone(
          {
            title:
              index === 3
                ? "A much longer headline that should clamp to three lines when the viewport is narrow enough to force wrapping across many words"
                : index === 0
                  ? "Latest wide card when eight articles are listed"
                  : `Article ${index + 1}`,
            excerpt:
              index === 5
                ? "Short excerpt."
                : "Preview excerpt text that can run for several lines in the card body area before the read link appears below the clamp region.",
            category: ["Foundations", "Recovery in Practice", "Material Explorations"][
              index % 3
            ]!,
            featured_image_url:
              index % 2 === 0
                ? `/images/materials/${["paper", "glass", "metal", "textiles"][index % 4]}.webp`
                : null,
            featured_image_alt: index % 2 === 0 ? `Poster ${index + 1}` : null,
            published_at: `2025-${String(11 - index).padStart(2, "0")}-01`,
          },
          index,
        ),
      );
    default:
      return fallback;
  }
}
