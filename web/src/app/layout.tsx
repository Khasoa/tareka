import type { Metadata } from "next";
import {
  Caveat,
  Geist,
  Geist_Mono,
  Overpass,
  Paytone_One,
} from "next/font/google";

import Footer from "@/components/Footer";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const overpass = Overpass({
  variable: "--font-overpass",
  subsets: ["latin"],
});

const paytone = Paytone_One({
  variable: "--font-paytone",
  weight: "400",
  subsets: ["latin"],
});

/** Handwritten annotation for the hero “science” layer. */
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  title: "tareka",
  description: "Discover where to take your waste — and who's turning it into something new.",
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${overpass.variable} ${paytone.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
