import type { Metadata } from "next";

import { getSiteOrigin } from "@/lib/siteOrigin";

export const SITE_NAME = "tareka";

export const DEFAULT_SITE_DESCRIPTION =
  "Discover where to take your waste — and who's turning it into something new.";

export const HOME_ABSOLUTE_TITLE =
  "tareka | Recycling and recovery directory in Kenya";

export const HOME_DESCRIPTION =
  "Find where to take recyclables in Kenya and who turns waste into something new. Search recycling, collection and upcycling businesses by material and county.";

/** Title that bypasses the root `%s | tareka` template. */
export function absoluteTitle(title: string): Metadata["title"] {
  return { absolute: title };
}

type PageMetadataOptions = {
  /** Title segment only — root layout appends `| tareka`. */
  title: string;
  description: string;
  /** Canonical path, e.g. `/insights` — no query string. */
  path: string;
  openGraph?: {
    type?: "website" | "article";
    title?: string;
    images?: string[];
  };
  twitter?: {
    title?: string;
  };
};

export function normalizeTitleSegment(title: string): string {
  return title.replace(/\s*\|\s*tareka\s*$/i, "").trim();
}

export function pageMetadata(options: PageMetadataOptions): Metadata {
  const titleSegment = normalizeTitleSegment(options.title);
  const canonicalPath = options.path.startsWith("/")
    ? options.path
    : `/${options.path}`;
  const siteOrigin = getSiteOrigin();
  const pageUrl = `${siteOrigin}${canonicalPath === "/" ? "" : canonicalPath}`;
  const canonicalAlternate =
    canonicalPath === "/" ? `${siteOrigin}/` : canonicalPath;
  const openGraphTitle = options.openGraph?.title ?? titleSegment;
  const twitterTitle = options.twitter?.title ?? openGraphTitle;

  return {
    title: titleSegment,
    description: options.description,
    alternates: {
      canonical: canonicalAlternate,
    },
    openGraph: {
      type: options.openGraph?.type ?? "website",
      url: pageUrl,
      siteName: SITE_NAME,
      title: openGraphTitle,
      description: options.description,
      ...(options.openGraph?.images?.length
        ? { images: options.openGraph.images }
        : {}),
    },
    twitter: {
      card: "summary",
      title: twitterTitle,
      description: options.description,
    },
  };
}

export const adminRobotsMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type BusinessListingMetaInput = {
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
};

function businessListingDescription(business: BusinessListingMetaInput): string {
  const trimmed = business.description?.trim();
  if (trimmed) {
    return trimmed.length > 160 ? `${trimmed.slice(0, 157)}…` : trimmed;
  }
  return `${business.name} — recovery business listing on tareka in Kenya.`;
}

export function businessDetailMetadata(
  business: BusinessListingMetaInput,
): Metadata {
  return pageMetadata({
    title: business.name,
    description: businessListingDescription(business),
    path: `/directory/${business.slug}`,
    openGraph: business.image_url
      ? { images: [business.image_url] }
      : undefined,
  });
}

export function businessClaimMetadata(business: {
  name: string;
  slug: string;
}): Metadata {
  return pageMetadata({
    title: `Claim ${business.name}`,
    description: `If you represent ${business.name}, submit a claim to request corrections to this listing on tareka.`,
    path: `/directory/${business.slug}/claim`,
  });
}

export function businessNotFoundMetadata(slug: string): Metadata {
  return pageMetadata({
    title: "Business not found",
    description: "This directory listing could not be found.",
    path: `/directory/${slug}`,
  });
}
