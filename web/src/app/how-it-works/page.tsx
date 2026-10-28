
import Link from "next/link";

import Header from "@/components/Header";

export const metadata = {
  title: "How it works | tareka",
  description:
    "Learn how tareka verifies recovery businesses, helps people find material recovery options, and handles business claims and content consent.",
};

const steps = [
  {
    number: "01",
    title: "We research and verify businesses",
    paragraphs: [
      "We research businesses involved in recycling, collection, aggregation and upcycling. Before a business appears in our public directory, it must be active and marked as verified in our system.",
      "Our review considers relevant information such as business identity, location, materials handled, recovery activities and service details. Verification records can retain the review outcome, date, source information and notes.",
    ],
  },
  {
    number: "02",
    title: "Find a recovery option",
    paragraphs: [
      "Browse businesses by material, county, business type and public drop-off availability. Use the profile details to identify businesses that may be suitable for your materials.",
      "Acceptance policies and operating arrangements can change. Contact the business to confirm what it currently accepts, any conditions or fees, and whether you need to arrange a visit before travelling.",
    ],
  },
  {
    number: "03",
    title: "Businesses can claim their profiles",
    paragraphs: [
      "If you represent a business already in our directory, you can request to claim its profile. We review the request before approving a representative to help keep the business information accurate.",
      "A claim can include proposed corrections or updated information. Submitting a claim does not automatically change a business's verification status; tareka reviews the claim separately.",
    ],
  },
  {
    number: "04",
    title: "Content participation is a separate choice",
    paragraphs: [
      "We may feature recovery businesses in tareka articles, educational content and social channels, including LinkedIn.",
      "Our claim process records content-use consent and image consent separately. Claiming a profile is not, by itself, a substitute for the relevant consent. The scope of any permission should be clear before a business's information or images are used in a feature.",
    ],
  },
  {
    number: "05",
    title: "Help keep information accurate",
    paragraphs: [
      "Business details, accepted materials and drop-off arrangements can change. We may review information periodically and update a profile when new information is confirmed.",
      "If you know a business we should consider, or spot information that needs correcting, you can suggest a business or contact us.",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--color-paper)] px-6 py-10 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="link-row text-sm font-medium">
          <span className="link-arrow" aria-hidden="true">
            ←
          </span>
          <span className="link-accent">Back to tareka</span>
        </Link>

        <div className="mt-10 max-w-2xl sm:mt-14">
          <p className="kicker">About tareka</p>

          <h1 className="page-heading mt-4">
            How it works
          </h1>

          <p className="mt-6 text-base leading-relaxed text-[var(--color-muted)] sm:text-lg">
            tareka is a place to look up recycling, collection and upcycling
            businesses in Kenya — and to see what people are making from
            materials that might otherwise be thrown away. The practical side
            is finding somewhere that may take a material. The other side is
            the work of turning that material into something else. Listings
            are researched before they are published. They are not a guarantee
            of what a business will accept on a given day.
          </p>
        </div>

        <div className="mt-16 border-t border-[var(--color-border)]">
          {steps.map((step) => (
            <section
              key={step.number}
              className="grid grid-cols-1 gap-4 border-b border-[var(--color-border)] py-8 sm:grid-cols-[72px_1fr] sm:gap-8 sm:py-10"
            >
              <p className="text-sm font-medium tabular-nums text-[var(--color-muted)]">
                {step.number}
              </p>

              <div>
                <h2 className="text-xl font-medium tracking-tight text-[var(--color-ink)] sm:text-2xl">
                  {step.title}
                </h2>

                <div className="mt-4 max-w-2xl space-y-4">
                  {step.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-sm leading-relaxed text-[var(--color-muted)] sm:text-base"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start gap-4 border-t border-[var(--color-border)] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-medium text-[var(--color-ink)]">
              Know a business we should include?
            </h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Help us discover more of Kenya&apos;s material recovery
              businesses.
            </p>
          </div>

          <Link href="/suggest" className="btn-primary w-fit">
            Suggest a business <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)] normal-case transition-colors hover:text-[var(--color-ink)]"
          >
            <span aria-hidden="true">←</span>
            Back to tareka
          </Link>
        </div>
      </div>
    </main>
    </>
  );
}