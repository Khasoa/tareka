import type { Metadata } from "next";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import IntroCards from "@/components/IntroCards";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Intro",
  description:
    "What is recycling to you? An introduction to tareka, Kenya's recovery directory.",
  path: "/intro",
});

export default function IntroPage() {
  return (
    <>
      <Header />
      <IntroCards>
        <Hero />
      </IntroCards>
    </>
  );
}
