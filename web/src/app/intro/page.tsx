import type { Metadata } from "next";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import IntroCards from "@/components/IntroCards";

export const metadata: Metadata = {
  title: "tareka — recycling is art, science and balance",
  description:
    "What is recycling to you? An introduction to tareka, Kenya's recovery directory.",
};

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
