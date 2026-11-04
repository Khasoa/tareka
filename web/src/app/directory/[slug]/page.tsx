import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import BackToDirectory from "@/components/BackToDirectory";
import { BusinessAbout } from "@/components/directory/BusinessAbout";
import { DetailFactRow } from "@/components/directory/DetailFactRow";
import { InkExternalLink } from "@/components/directory/InkExternalLink";
import Header from "@/components/Header";
import { LinkWithArrow } from "@/components/LinkWithArrow";
import VerificationBadge from "@/components/VerificationBadge";
import { getBusiness } from "@/lib/api";
import {
  businessDetailMetadata,
  businessNotFoundMetadata,
} from "@/lib/metadata";
import {
  formatBusinessTypesLine,
  formatLastChecked,
  formatLocation,
  serviceAvailabilityPublicDetail,
} from "@/lib/publicLabels";

type BusinessPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: BusinessPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const business = await getBusiness(slug);
    return businessDetailMetadata(business);
  } catch {
    return businessNotFoundMetadata(slug);
  }
}

function isSafeHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function ServiceValue({ value }: { value: string }) {
  const display = serviceAvailabilityPublicDetail(value);

  return (
    <span className="inline-flex items-center gap-2.5 text-[var(--color-ink)]">
      {display.showGreenDot ? (
        <span
          aria-hidden="true"
          className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)] ring-1 ring-[var(--color-ink)]"
        />
      ) : null}
      {display.label}
    </span>
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
  const lastChecked = business.last_verified_at
    ? formatLastChecked(business.last_verified_at)
    : null;
  const materialsFallback = business.phone
    ? "Accepted materials are not listed — confirm with the business before travelling."
    : "Accepted materials are not listed. Confirm with the business before travelling.";
  const hasAbout = Boolean(business.description?.trim());

  return (
    <>
      <Header />

      <main className="business-detail-page page-shell py-12 sm:py-16">
        <BackToDirectory bodyInk />

        <article
          className={`business-detail mt-4 sm:mt-5${hasAbout ? " business-detail--has-about" : " business-detail--no-about"}`}
        >
          <div className="business-detail__frame">
            {business.image_url && isSafeHttpUrl(business.image_url) ? (
              <figure className="business-detail__hero mb-10 max-w-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={business.image_url}
                  alt={business.image_alt || ""}
                  className="max-h-80 w-full rounded-[var(--radius-media)] object-cover"
                />
              </figure>
            ) : null}

            <header className="business-detail__header">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <h1 className="page-heading">{business.name}</h1>
                <VerificationBadge
                  status={business.verification_status}
                  size="md"
                />
              </div>

              {leadLine ? (
                <p className="mt-3 text-sm text-[var(--color-muted)]">
                  {leadLine}
                </p>
              ) : null}

              {lastChecked ? (
                <div className="business-detail__verified">
                  <p className="business-detail__verified-line text-sm text-[var(--color-body)]">
                    Confirmed active · Last checked {lastChecked}
                  </p>
                  <p className="business-detail__how-we-check">
                    <Link
                      href="/how-it-works#active"
                      className="business-detail-body-link text-sm font-medium"
                    >
                      <span className="business-detail-body-link__text">
                        How we check
                      </span>
                    </Link>
                  </p>
                </div>
              ) : null}
            </header>

            <hr className="business-detail__header-rule" />

            <div className="business-detail__layout">
              <div className="business-detail__main">
                {hasAbout ? (
                  <BusinessAbout description={business.description!} />
                ) : null}

                <dl className="detail-fact-list">
                  <DetailFactRow label="Materials">
                    {materials.length > 0 ? (
                      <ul className="flex flex-wrap gap-2">
                        {materials.map((material) => (
                          <li
                            key={material.id}
                            className="status-chip status-chip--lg"
                          >
                            {material.name}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-sm text-[var(--color-muted)]">
                        {materialsFallback}
                      </span>
                    )}
                  </DetailFactRow>

                  <DetailFactRow label="Public drop-off">
                    <ServiceValue value={business.accepts_public_dropoff} />
                  </DetailFactRow>

                  <DetailFactRow label="Pick-up">
                    <ServiceValue value={business.offers_pickup} />
                  </DetailFactRow>

                  {location ? (
                    <DetailFactRow label="Location">
                      <span className="text-[var(--color-ink)]">{location}</span>
                    </DetailFactRow>
                  ) : null}

                  {business.phone ? (
                    <DetailFactRow label="Phone">
                      <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <a
                          href={`tel:${business.phone}`}
                          className="business-detail-body-link business-detail-body-link--solo"
                        >
                          <span className="business-detail-body-link__text">
                            {business.phone}
                          </span>
                        </a>
                        <InkExternalLink
                          href={`https://wa.me/${business.phone.replace(/\D/g, "")}`}
                          arrow="↗"
                        >
                          WhatsApp
                        </InkExternalLink>
                      </span>
                    </DetailFactRow>
                  ) : null}

                  {websiteHref ? (
                    <DetailFactRow label="Website">
                      <InkExternalLink href={websiteHref} arrow="↗">
                        Visit website
                      </InkExternalLink>
                    </DetailFactRow>
                  ) : null}

                  {business.email ? (
                    <DetailFactRow label="Email">
                      <a
                        href={`mailto:${business.email}`}
                        className="business-detail-body-link business-detail-body-link--solo"
                      >
                        <span className="business-detail-body-link__text">
                          {business.email}
                        </span>
                      </a>
                    </DetailFactRow>
                  ) : null}
                </dl>
              </div>

              <aside className="business-detail__aside">
                <div className="business-detail-actions-card">
                  {directionsHref ? (
                    <>
                      <InkExternalLink
                        href={directionsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium"
                      >
                        Get directions
                      </InkExternalLink>
                      <hr
                        className="business-detail-actions-card__divider"
                        aria-hidden="true"
                      />
                    </>
                  ) : null}

                  <div className="business-detail-actions-card__claim">
                    <p className="business-detail-actions-card__prompt">
                      Is this your business?
                    </p>
                    <LinkWithArrow
                      href={`/directory/${business.slug}/claim`}
                      arrow="→"
                      className="business-detail-body-link text-sm font-medium"
                      underlineClassName="business-detail-body-link__text"
                    >
                      Claim this listing
                    </LinkWithArrow>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </article>
      </main>
    </>
  );
}
