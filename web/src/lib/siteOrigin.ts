const DEFAULT_CANONICAL_ORIGIN = "https://tareka.directory";

/** Canonical site origin for metadata, sitemap, and JSON-LD. */
export function getSiteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) {
    return DEFAULT_CANONICAL_ORIGIN;
  }

  try {
    const url = new URL(configured);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return DEFAULT_CANONICAL_ORIGIN;
    }
    return url.origin;
  } catch {
    return DEFAULT_CANONICAL_ORIGIN;
  }
}
