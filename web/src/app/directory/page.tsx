import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { pageMetadata } from "@/lib/metadata";

/** Legacy route — canonical directory URL is `/`. */
export const metadata: Metadata = {
  ...pageMetadata({
    title: "Find recovery businesses",
    description:
      "Search verified recycling, collection and upcycling businesses across Kenya by material and county.",
    path: "/",
  }),
  robots: {
    index: false,
    follow: true,
  },
};

type DirectoryRedirectProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Legacy list route — `/` is the canonical directory.
 * Preserve filter/search query params so deep links keep working.
 */
export default async function DirectoryRedirect({
  searchParams,
}: DirectoryRedirectProps) {
  const params = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      query.set(key, value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        query.append(key, item);
      }
    }
  }

  const qs = query.toString();
  redirect(qs ? `/?${qs}` : "/");
}
