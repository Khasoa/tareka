import { Suspense } from "react";
import type { Metadata } from "next";

import Header from "@/components/Header";
import InsightsIndex from "@/components/InsightsIndex";
import {
  fetchAllPublishedInsightSummaries,
} from "@/lib/publicInsightsApi";
import { pageMetadata } from "@/lib/metadata";

export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
  title: "Insights",
  description:
    "Explore materials, recycling, recovery methods and Kenya's recovery systems.",
  path: "/insights",
});

export default async function InsightsIndexPage() {
  const insights = await fetchAllPublishedInsightSummaries();

  return (
    <>
      <Header />
      <Suspense fallback={null}>
        <InsightsIndex insights={insights} />
      </Suspense>
    </>
  );
}
