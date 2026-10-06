import Link from "next/link";

import Header from "@/components/Header";
import VerifiedMark from "@/components/VerifiedMark";
import { getBusiness } from "@/lib/api";

type BusinessPageProps = { params: Promise<{ slug: string }> };

export default async function BusinessPage({ params }: BusinessPageProps) {
  const { slug } = await params;
  const business = await getBusiness(slug);
  const primaryLocation = business.locations[0];
  const isVerified = business.verification_status === "verified";

  return (
    <>
      <Header />

      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/directory" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]">
          ← Back to directory
        </Link>

        <article className="mt-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{business.name}</h1>
            <span className="flex items-center gap-1 text-xs font-medium capitalize text-[var(--color-muted)]">
              {isVerified && <VerifiedMark />}
              {business.verification_status.replace("_", " ")}
            </span>
          </div>

          <p className="mt-2 capitalize text-[var(--color-muted)]">{business.business_type}</p>

          {primaryLocation && (
            <p className="mt-2">
              {primaryLocation.town ? `${primaryLocation.town}, ` : ""}
              {primaryLocation.county}
            </p>
          )}

          <p className="mt-4 text-sm text-[var(--color-muted)]">
            Public drop-off: <span className="text-[var(--color-ink)]">{business.accepts_public_dropoff}</span>
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Materials accepted may vary — call before you go.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {business.phone && (
              <a
                href={`tel:${business.phone}`}
                className="rounded-full border border-[var(--color-border-strong)] px-4 py-2 text-sm transition-colors hover:border-[var(--color-accent-text)] hover:bg-[var(--color-accent-soft)]"
              >
                Call
              </a>
            )}
            {business.phone && (
              <a
                href={`https://wa.me/${business.phone.replace(/\D/g, "")}`}
                className="rounded-full border border-[var(--color-border-strong)] px-4 py-2 text-sm transition-colors hover:border-[var(--color-accent-text)] hover:bg-[var(--color-accent-soft)]"
              >
                WhatsApp
              </a>
            )}
            {business.website_url && (
              <a
                href={business.website_url}
                target="_blank"
                className="rounded-full border border-[var(--color-border-strong)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--color-accent-text)] hover:bg-[var(--color-accent-soft)]"
              >
                Website
              </a>
            )}
          </div>

          {business.description && (
            <p className="mt-8 max-w-2xl leading-relaxed">{business.description}</p>
          )}

          {business.materials.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-semibold">Materials</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {business.materials.map((material) => (
                  <li
                    key={material.id}
                    className="rounded-full border border-[var(--color-border)] px-3 py-1 text-sm"
                  >
                    {material.name}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </main>
    </>
  );
}