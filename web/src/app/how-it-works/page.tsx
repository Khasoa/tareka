import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import Header from "@/components/Header";
import { pageMetadata } from "@/lib/metadata";
import { SITE_CONTACT_EMAIL } from "@/lib/siteConfig";

export const metadata: Metadata = pageMetadata({
  title: "How It Works",
  description:
    "How tareka checks recovery businesses, helps you find a place for your materials, and handles claims and consent.",
  path: "/how-it-works",
});

type ProcessStep = {
  number: string;
  sectionId?: string;
  title: string;
  body: string;
};

const processSteps: ProcessStep[] = [
  {
    number: "01",
    sectionId: "active",
    title: "We check every business",
    body:
      "Before a business appears in the directory, we confirm it is operating and that its listed services and materials are accurate. The date on each profile shows when we last checked, and anything older than a year comes off. Active describes what we checked. It is not a licence, certification or endorsement.",
  },
  {
    number: "02",
    title: "You find a place",
    body:
      "Browse by material, county, business type, or whether a place takes public drop-offs or pick-ups. Profiles are a starting point — contact the business to confirm what they take today, any fees, and whether you need to book ahead.",
  },
  {
    number: "03",
    title: "Businesses can claim a profile",
    body:
      "If you represent a business already listed, you can request access to its profile. We review who you are before approving a claim. Corrections you submit still go through our review — claiming does not automatically change Active status.",
  },
];

type GoodToKnowItem = {
  title: string;
  body: ReactNode;
};

const goodToKnow: GoodToKnowItem[] = [
  {
    title: "Features are opt-in",
    body: (
      <>
        We sometimes feature businesses in articles or on social channels. Consent
        for that is separate from claiming a profile — we ask before using names
        or photos in a feature.
      </>
    ),
  },
  {
    title: "Help us stay accurate",
    body: (
      <>
        Details change. We update profiles when we learn something new. Spot a
        gap?{" "}
        <Link
          href="/suggest"
          className="font-medium text-[var(--color-ink)] link-text-underline link-text-underline--ink"
        >
          Suggest a business
        </Link>{" "}
        or contact us through {SITE_CONTACT_EMAIL}.
      </>
    ),
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <Header />
      <main className="how-it-works-page min-h-screen bg-[var(--color-paper)] py-10 sm:py-16">
        <div className="page-shell">
          <Link href="/#directory" className="link-row text-sm font-medium">
            <span className="link-arrow" aria-hidden="true">
              ←
            </span>
            <span className="link-accent">Back to directory</span>
          </Link>

          <div className="how-it-works-layout mt-10 sm:mt-14">
            <header className="how-it-works-page__intro">
              <p className="kicker">About tareka</p>

              <h1 className="page-heading mt-4">How it works</h1>

              <p className="mt-5 text-sm leading-relaxed text-[var(--color-muted)] sm:text-base">
                tareka is a place to look up recycling, collection and upcycling
                businesses in Kenya — and to see what people are making from
                materials that might otherwise be thrown away. One side is finding
                somewhere that takes a material. The other is the work of turning
                it into something else. Listings are researched before they go
                live.
              </p>
            </header>

            <div className="how-it-works-page__main">
              <ol className="how-it-works-steps">
                {processSteps.map((step) => (
                  <li
                    key={step.number}
                    id={step.sectionId}
                    style={
                      step.sectionId
                        ? { scrollMarginTop: "var(--site-header-h)" }
                        : undefined
                    }
                    className="how-it-works-step"
                  >
                    <span className="how-it-works-step__index" aria-hidden="true">
                      {step.number}
                    </span>
                    <div className="how-it-works-step__body">
                      <h2 className="how-it-works-step__title">{step.title}</h2>
                      <p className="how-it-works-step__text">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <section
                className="how-it-works-aside"
                aria-labelledby="how-good-to-know"
              >
                <h2 id="how-good-to-know" className="kicker">
                  Good to know
                </h2>

                <ul className="how-it-works-aside__list">
                  {goodToKnow.map((item) => (
                    <li key={item.title} className="how-it-works-aside__item">
                      <h3 className="how-it-works-aside__title">{item.title}</h3>
                      <p className="how-it-works-aside__text">{item.body}</p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>

          <div className="mt-14 border-t border-[var(--color-border)] pt-8 sm:mt-16">
            <Link href="/#directory" className="link-row text-sm font-medium">
              <span className="link-arrow" aria-hidden="true">
                ←
              </span>
              <span className="link-row-ink">Back to directory</span>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
