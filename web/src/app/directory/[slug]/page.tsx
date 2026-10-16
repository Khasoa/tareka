import Link from "next/link";

import Header from "@/components/Header";
import VerificationBadge from "@/components/VerificationBadge";
import { getBusiness } from "@/lib/api";
import {
  dropoffLabel,
  formatBusinessType,
  formatLocation,
} from "@/lib/publicLabels";

type BusinessPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BusinessPage({
  params,
}: BusinessPageProps) {
  const { slug } = await params;
  const business = await getBusiness(slug);
  const primaryLocation = business.locations[0];
  const location = primaryLocation
    ? formatLocation(primaryLocation.town, primaryLocation.county)
    : "";
  const materials = business.materials ?? [];
  const hasContact = Boolean(
    business.phone || business.website_url || business.email,
  );

  return (
    <>
      <Header />

      <main className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
        <Link
          href="/#directory"
          className="link-accent-quiet text-sm text-[var(--color-muted)]"
        >
          ← Back to directory
        </Link>

        <article className="mt-8">
          {business.image_url ? (
            <figure className="mb-8 max-w-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={business.image_url}
                alt={business.image_alt || ""}
                className="max-h-80 w-full rounded-[var(--radius-media)] object-cover"
              />
            </figure>
          ) : null}

          <header className="max-w-3xl border-b border-[var(--color-border)] pb-8">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="page-heading">{business.name}</h1>
              <VerificationBadge
                status={business.verification_status}
                size="md"
              />
            </div>

            <p className="mt-3 text-sm capitalize text-[var(--color-muted)]">
              {formatBusinessType(business.business_type)}
              {location ? (
                <>
                  <span aria-hidden="true"> · </span>
                  {location}
                </>
              ) : null}
            </p>
          </header>

          <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)] lg:items-start">
            <div>
              {business.description ? (
                <p className="max-w-2xl text-base leading-relaxed text-[var(--color-body)] sm:text-lg">
                  {business.description}
                </p>
              ) : null}

              {materials.length > 0 ? (
                <section className="mt-10">
                  <h2 className="font-display text-lg font-semibold tracking-tight">
                    Materials
                  </h2>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {materials.map((material) => (
                      <li key={material.id} className="status-chip sm:text-xs">
                        {material.name}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : (
                <p className="mt-10 max-w-md text-sm text-[var(--color-muted)]">
                  {business.phone
                    ? "Accepted materials are not listed — confirm with the business before travelling."
                    : "Accepted materials are not listed. Confirm with the business before travelling."}
                </p>
              )}
            </div>

            <aside className="flex flex-col gap-8 border-t border-[var(--color-border)] pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              <section>
                <h2 className="text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  Drop-off
                </h2>
                <p className="mt-2 text-sm text-[var(--color-ink)]">
                  {dropoffLabel(business.accepts_public_dropoff)}
                </p>
              </section>

              {location ? (
                <section>
                  <h2 className="text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Location
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink)]">
                    {location}
                  </p>
                </section>
              ) : null}

              {hasContact ? (
                <section>
                  <h2 className="text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    Contact
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {business.phone ? (
                      <a href={`tel:${business.phone}`} className="btn-secondary">
                        Call
                      </a>
                    ) : null}
                    {business.phone ? (
                      <a
                        href={`https://wa.me/${business.phone.replace(/\D/g, "")}`}
                        className="btn-secondary"
                      >
                        WhatsApp
                      </a>
                    ) : null}
                    {business.website_url ? (
                      <a
                        href={business.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary"
                      >
                        Website
                      </a>
                    ) : null}
                    {business.email ? (
                      <a
                        href={`mailto:${business.email}`}
                        className="btn-secondary"
                      >
                        Email
                      </a>
                    ) : null}
                  </div>
                </section>
              ) : null}

              <p>
                <Link
                  href={`/directory/${business.slug}/claim`}
                  className="link-accent text-sm font-medium"
                >
                  Is this your business? Claim this listing →
                </Link>
              </p>
            </aside>
          </div>
        </article>
      </main>
    </>
  );
}
