import type { Metadata } from "next";

import {
  absoluteTitle,
  HOME_ABSOLUTE_TITLE,
  HOME_DESCRIPTION,
  SITE_NAME,
} from "@/lib/metadata";
import { getSiteOrigin } from "@/lib/siteOrigin";

const siteOrigin = getSiteOrigin();

export const metadata: Metadata = {
  title: absoluteTitle(HOME_ABSOLUTE_TITLE),
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: `${siteOrigin}/`,
  },
  openGraph: {
    type: "website",
    url: siteOrigin,
    siteName: SITE_NAME,
    title: HOME_ABSOLUTE_TITLE,
    description: HOME_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: HOME_ABSOLUTE_TITLE,
    description: HOME_DESCRIPTION,
  },
};

function HomeJsonLd() {
  const logo = `${siteOrigin}/icon.svg`;
  const payload = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "tareka",
        url: siteOrigin,
        logo,
      },
      {
        "@type": "WebSite",
        name: "tareka",
        url: siteOrigin,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}

export { HomeJsonLd };
