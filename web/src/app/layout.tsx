import type { Metadata } from "next";
import { Suspense } from "react";
import { Caveat, Outfit } from "next/font/google";

import CardTransitionGate from "@/components/CardTransitionGate";
import Footer from "@/components/Footer";
import HideOnIntro from "@/components/HideOnIntro";
import { DEFAULT_SITE_DESCRIPTION } from "@/lib/metadata";
import { getSiteOrigin } from "@/lib/siteOrigin";

import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

const siteOrigin = getSiteOrigin();

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: "tareka",
    template: "%s | tareka",
  },
  description: DEFAULT_SITE_DESCRIPTION,
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
