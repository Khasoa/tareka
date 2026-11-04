import type { Metadata } from "next";

import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Suggest a business",
  description:
    "Know a recovery, recycling or collection business in Kenya that should be on tareka? Submit a suggestion for our team to review.",
  path: "/suggest",
});

export default function SuggestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
