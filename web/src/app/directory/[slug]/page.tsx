import Link from "next/link";
import { notFound } from "next/navigation";

import BackToDirectory from "@/components/BackToDirectory";
import Header from "@/components/Header";
import VerificationBadge from "@/components/VerificationBadge";
import { getBusiness } from "@/lib/api";
import {
  formatBusinessTypesLine,
  formatLastChecked,
  formatLocation,
  serviceAvailabilityPublicDetail,
} from "@/lib/publicLabels";

type BusinessPageProps = {
  params: Promise<{ slug: string }>;
};

function isSafeHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function ServiceRow({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  const display = serviceAvailabilityPublicDetail(value);

  return (
    <section>
      <h2 className="kicker">{title}</h2>
      <p className="mt-3 flex items-center gap-2.5 text-base text-[var(--color-ink)]">
        {display.showGreenDot ? (
          <span
            aria-hidden="true"
            className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)] ring-1 ring-[var(--color-ink)]"
          />
        ) : null}
        {display.label}
      </p>
    </section>
  );
}

export default async function BusinessPage({ params }: BusinessPageProps) {
  const { slug } = await params;
  let business;
  try {
    business = await getBusiness(slug);
  } catch {
    notFound();
  }

  const primaryLocation = business.locations[0];
  const location = primaryLocation
    ? formatLocation(primaryLocation.town, primaryLocation.county)
    : "";
  const materials = business.materials ?? [];
  const typesLine = formatBusinessTypesLine(business.business_types);
  const leadLine = [typesLine, location].filter(Boolean).join(" · ");
  const websiteHref =
    business.website_url && isSafeHttpUrl(business.website_url)
      ? business.website_url
      : "";
  const directionsHref = location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${business.name} ${location}`,
      )}`
    : "";
  const hasContact = Boolean(business.phone || websiteHref || business.email);
  const lastChecked = business.last_verified_at
    ? formatLastChecked(business.last_verified_at)
    : null;

  return (
    <>
      <Header />

      <main className="page-shell py-12 sm:py-16">
        <BackToDirectory />

        <article className="mt-10">
          {business.image_url && isSafeHttpUrl(business.image_url) ? (
            <figure className="mb-10 max-w-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={business.image_url}
                alt={business.image_alt || ""}
                className="max-h-80 w-full rounded-[var(--radius-media)] object-cover"
              />
            </figure>
          ) : null}

          <header className="border-b border-[var(--color-border)] pb-10">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <h1 className="page-heading">{business.name}</h1>
              <VerificationBadge
                status={business.verification_status}
                size="md"
              />
            </div>

            {leadLine ? (
              <p className="mt-3 text-sm text-[var(--color-muted)]">{leadLine}</p>
            ) : null}

            {lastChecked ? (
              <p className="mt-4 text-sm text-[var(--color-body)]">
                Confirmed active · Last checked {lastChecked}{" "}
                <Link
                  href="/how-it-works#active"
                  className="link-accent font-normal text-[var(--color-muted)]"
                >
                  How we check
                </Link>
              </p>
            ) : null}
          </header>

          <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)] lg:items-start">
            <div className="flex flex-col gap-12">
              {business.description ? (
                <p className="max-w-2xl text-base leading-relaxed text-[var(--color-body)] sm:text-lg">
                  {business.description}
                </p>
              ) : null}

              {materials.length > 0 ? (
                <section>
                  <h2 className="kicker">Materials</h2>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {materials.map((material) => (
                      <li
                        key={material.id}
                        className="status-chip status-chip--lg"
                      >
                        {material.name}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : (
                <p className="max-w-md text-sm text-[var(--color-muted)]">
                  {business.phone
                    ? "Accepted materials are not listed — confirm with the business before travelling."
                    : "Accepted materials are not listed. Confirm with the business before travelling."}
                </p>
              )}
            </div>

            <aside className="flex flex-col gap-10 border-t border-[var(--color-border)] pt-10 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              <ServiceRow
                title="Public drop-off"
                value={business.accepts_public_dropoff}
              />
              <ServiceRow title="Pick-up" value={business.offers_pickup} />

              {location ? (
                <section>
                  <h2 className="kicker">Location</h2>
                  <p className="mt-3 text-base text-[var(--color-ink)]">
                    {location}
                  </p>
                  <a
                    href={directionsHref}
                    target="_blank"
                    rel="noreferrer"
                    className="link-row mt-3 text-sm font-medium"
                  >
                    <span className="link-accent">Get directions</span>
                    <span className="link-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </a>
                </section>
              ) : null}

              {hasContact ? (
                <section>
                  <h2 className="kicker">Contact</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {business.phone ? (
                      <a href={`tel:${business.phone}`} className="btn-secondary">
                        Call
                      </a>
                    ) : null}
                    {business.phone ? (
                      <a
                        href={`https://wa.me/${business.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary"
                      >
                        WhatsApp
                      </a>
                    ) : null}
                    {websiteHref ? (
                      <a
                        href={websiteHref}
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
                  className="link-row text-sm font-medium"
                >
                  <span className="link-accent">
                    Is this your business? Claim this listing
                  </span>
                  <span className="link-arrow" aria-hidden="true">
                    →
                  </span>
                </Link>
              </p>
            </aside>
          </div>
        </article>
      </main>
    </>
  );
}
