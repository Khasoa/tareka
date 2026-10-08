import Link from "next/link";

import Header from "@/components/Header";
import ClaimForm from "@/components/ClaimForm";
import { getBusiness } from "@/lib/api";

type ClaimPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ClaimPage({ params }: ClaimPageProps) {
  const { slug } = await params;
  const business = await getBusiness(slug);

  return (
    <>
      <Header />

      <main className="mx-auto w-full max-w-2xl px-6 py-12 sm:py-16">
        <Link
          href={`/directory/${business.slug}`}
          className="text-sm font-medium text-[var(--color-muted)] transition hover:text-[var(--color-ink)]"
        >
          ← Back to listing
        </Link>

        <div className="mt-6 border-b border-black pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent-text)]">
            Business listing
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Claim {business.name}
          </h1>

          <p className="mt-4 max-w-xl leading-7 text-[var(--color-muted)]">
            If you represent this business, use this form to tell us who
            you are and request any corrections to the listing.
          </p>

          <div className="mt-5 rounded-xl border border-black bg-[var(--color-accent-soft)] p-4">
            <p className="text-sm font-semibold text-[var(--color-heading)]">
              Claims are reviewed before changes are made.
            </p>

            <p className="mt-1 text-sm leading-6 text-[var(--color-body)]">
              Approval records the claim, but requested corrections are
              not automatically published. Our team verifies and reviews
              changes separately.
            </p>
          </div>
        </div>

        <ClaimForm businessId={business.id} />
      </main>
    </>
  );
}