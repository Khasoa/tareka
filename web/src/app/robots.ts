import type { MetadataRoute } from "next";

import { getSiteOrigin } from "@/lib/siteOrigin";

export default function robots(): MetadataRoute.Robots {
  const siteOrigin = getSiteOrigin();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/dev"],
      },
    ],
    sitemap: `${siteOrigin}/sitemap.xml`,
  };
}
