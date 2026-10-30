import Link from "next/link";
import VerificationBadge from "@/components/VerificationBadge";
import type { Business } from "@/lib/api";
import { formatBusinessTypesLine, formatLocation } from "@/lib/publicLabels";

type BusinessCardProps = {
  business: Business;
  /** No longer shown: list position stops meaning anything once filters reorder results. */
  index?: number;
};

function ServiceDot({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-[var(--color-ink)]">
      <span
        aria-hidden="true"
        className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)] ring-1 ring-[var(--color-ink)]"
      />
      {label}
    </span>
  );
}

export default function BusinessCard({ business }: BusinessCardProps) {
  const primaryLocation = business.locations[0];
  const location = primaryLocation
    ? formatLocation(primaryLocation.town, primaryLocation.county)
    : "";
  const materials = business.materials ?? [];
  const visibleMaterials = materials.slice(0, 3);
  const extraMaterials = materials.length - visibleMaterials.length;
  const typesLine = formatBusinessTypesLine(business.business_types);
  const leadLine = [typesLine, location].filter(Boolean).join(" · ");
  const showDropoff = business.accepts_public_dropoff === "yes";
  const showPickup = business.offers_pickup === "yes";

  return (
    <article className="group relative flex min-w-0 flex-col border-b border-[var(--color-border)] py-6 transition-colors duration-200 hover:border-[var(--color-border-strong)] sm:rounded-[var(--radius-control)] sm:border sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-medium leading-tight tracking-[-0.03em] text-[var(--color-ink)] sm:text-xl">
            <Link
              href={`/directory/${business.slug}`}
              className="outline-none transition-opacity hover:opacity-80 focus-visible:underline focus-visible:decoration-[var(--color-ink)] focus-visible:decoration-2 focus-visible:underline-offset-4"
            >
              {business.name}
            </Link>
          </h3>

          {leadLine ? (
            <p className="mt-2 text-sm text-[var(--color-muted)]">{leadLine}</p>
          ) : null}
        </div>

        <VerificationBadge status={business.verification_status} size="sm" />
      </div>

      {(showDropoff || showPickup) && (
        <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          {showDropoff ? <ServiceDot label="Public drop-off" /> : null}
          {showPickup ? <ServiceDot label="Pick-up" /> : null}
        </p>
      )}

      {materials.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {visibleMaterials.map((material) => (
            <span key={material.id} className="status-chip">
              {material.name}
            </span>
          ))}
          {extraMaterials > 0 ? (
            <span className="status-chip">+{extraMaterials}</span>
          ) : null}
        </div>
      )}

      <div className="mt-auto pt-6">
        <Link
          href={`/directory/${business.slug}`}
          aria-label={`View details for ${business.name}`}
          className="link-row text-sm font-medium outline-none after:absolute after:inset-0 focus-visible:opacity-80"
        >
          <span className="link-accent">View details</span>
          <span className="link-arrow" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </article>
  );
}
