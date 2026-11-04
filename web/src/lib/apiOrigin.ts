/** Resolve the public FastAPI base URL for server-side fetches. */

export function getPublicApiBaseUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!configured) {
    return null;
  }

  try {
    const parsed = new URL(configured);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }
    return configured.replace(/\/+$/, "");
  } catch {
    return null;
  }
}
