/** Path allow-list for FastAPI → Next.js on-demand revalidation (Phase 2A contract). */

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type RevalidationPayload = {
  paths: string[];
  slug?: string | null;
};

export function isAllowedRevalidationPath(path: string): boolean {
  if (path === "/insights" || path === "/sitemap.xml") {
    return true;
  }
  if (!path.startsWith("/insights/")) {
    return false;
  }
  const slug = path.slice("/insights/".length);
  return SLUG_PATTERN.test(slug);
}

export function parseRevalidationPayload(body: unknown): RevalidationPayload | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return null;
  }

  const record = body as Record<string, unknown>;
  if (!Array.isArray(record.paths) || record.paths.length === 0) {
    return null;
  }

  const paths: string[] = [];
  for (const entry of record.paths) {
    if (typeof entry !== "string" || !entry.startsWith("/")) {
      return null;
    }
    if (!isAllowedRevalidationPath(entry)) {
      return null;
    }
    paths.push(entry);
  }

  const slug =
    record.slug === undefined || record.slug === null
      ? null
      : typeof record.slug === "string"
        ? record.slug
        : null;

  if (slug !== null && !SLUG_PATTERN.test(slug)) {
    return null;
  }

  return { paths, slug };
}

export function authorizeRevalidationRequest(
  authorizationHeader: string | null,
  configuredSecret: string | undefined,
): boolean {
  const secret = configuredSecret?.trim();
  if (!secret) {
    return false;
  }
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return false;
  }
  const token = authorizationHeader.slice("Bearer ".length).trim();
  return token.length > 0 && token === secret;
}
