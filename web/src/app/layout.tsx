import type { Metadata } from "next";
import { Suspense } from "react";
import { Caveat, Outfit } from "next/font/google";

import CardTransitionGate from "@/components/CardTransitionGate";
import Footer from "@/components/Footer";
import HideOnIntro from "@/components/HideOnIntro";

import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  title: "tareka",
  description:
    "Discover where to take your waste — and who's turning it into something new.",
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${outfit.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Suspense fallback={null}>
          <CardTransitionGate />
          <div className="flex-1">{children}</div>
          <HideOnIntro>
            <Footer />
          </HideOnIntro>
        </Suspense>
      </body>
    </html>
  );
}
