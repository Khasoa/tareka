import type { NextConfig } from "next";

function normalizeOrigin(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    return fallback;
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    return fallback;
  }
}

const apiOrigin = normalizeOrigin(
  process.env.NEXT_PUBLIC_API_URL,
  "https://api.tareka.directory",
);
const insightsImageOrigin = normalizeOrigin(
  process.env.NEXT_PUBLIC_INSIGHTS_IMAGE_ORIGIN,
  "https://images.tareka.directory",
);

function insightsImageRemotePattern(): NonNullable<
  NextConfig["images"]
>["remotePatterns"] {
  try {
    const { hostname, protocol } = new URL(insightsImageOrigin);
    if (protocol !== "https:" && protocol !== "http:") {
      return [];
    }
    return [{ protocol: protocol.replace(":", "") as "http" | "https", hostname, pathname: "/**" }];
  } catch {
    return [
      {
        protocol: "https",
        hostname: "images.tareka.directory",
        pathname: "/**",
      },
    ];
  }
}

/**
 * Report-only CSP for initial observation. Next.js currently relies on inline
 * scripts (including homepage JSON-LD) and may require `'unsafe-inline'` /
 * `'unsafe-eval'` until nonces are wired through `next.config` headers callbacks.
 */
const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  `connect-src 'self' ${apiOrigin}`,
  `img-src 'self' data: blob: ${insightsImageOrigin} ${apiOrigin} https:`,
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy-Report-Only",
    value: contentSecurityPolicyReportOnly,
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: insightsImageRemotePattern(),
  },
  async headers() {
    const headers = [...securityHeaders];

    if (process.env.NODE_ENV === "production") {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains",
      });
    }

    return [
      {
        source: "/:path*",
        headers,
      },
    ];
  },
};

export default nextConfig;
