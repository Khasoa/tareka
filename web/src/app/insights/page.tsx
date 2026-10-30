import { Suspense } from "react";

import Header from "@/components/Header";
import InsightsIndex from "@/components/InsightsIndex";
import { getAllInsights } from "@/lib/insights";

export const metadata = {
  title: "Insights | tareka",
  description:
    "Explore materials, recycling, recovery methods and Kenya's recovery systems.",
};

export default function InsightsIndexPage() {
  const insights = getAllInsights();

  return (
    <>
      <Header />
      <Suspense fallback={null}>
        <InsightsIndex insights={insights} />
      </Suspense>
    </>
  );
}
