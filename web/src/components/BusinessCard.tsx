import Link from "next/link";
import VerificationBadge from "@/components/VerificationBadge";
import type { Business } from "@/lib/api";
import {
  dropoffLabel,
  formatBusinessType,
  formatLocation,
} from "@/lib/publicLabels";

type BusinessCardProps = {
  business: Business;
  index?: number;
};

export default function BusinessCard({
  business,
  index,
}: BusinessCardProps) {
  const primaryLocation = business.locations[0];
  const location = primaryLocation
    ? formatLocation(primaryLocation.town, primaryLocation.county)
    : "";
  const materials = business.materials ?? [];
  const visibleMaterials = materials.slice(0, 3);
  const extraMaterials = materials.length - visibleMaterials.length;

  return (
    <article className="group flex min-w-0 flex-col border-b border-[var(--color-border)] py-5 transition-colors duration-200 hover:border-[var(--color-border-strong)] sm:rounded-[var(--radius-panel)] sm:border sm:border-[var(--color-border)] sm:p-5 lg:p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="font-display text-xs tabular-nums text-[var(--color-muted)]">
          {typeof index === "number"
            ? String(index + 1).padStart(2, "0")
            : "—"}
        </span>

        <VerificationBadge status={business.verification_status} size="sm" />
      </div>

      <div className="mt-5 flex-1">
        <h3 className="font-display text-xl font-semibold leading-tight tracking-[-0.04em] text-[var(--color-ink)] sm:text-2xl">
          <Link
            href={`/directory/${business.slug}`}
            className="outline-none transition-opacity hover:opacity-80 focus-visible:underline focus-visible:decoration-[var(--color-ink)] focus-visible:decoration-2 focus-visible:underline-offset-4"
          >
            {business.name}
          </Link>
        </h3>

        <p className="mt-2 text-xs capitalize text-[var(--color-muted)]">
          {formatBusinessType(business.business_type)}
          {location ? (
            <>
              <span aria-hidden="true"> · </span>
              {location}
            </>
          ) : null}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-4">
        <span className="status-chip sm:text-xs">
          {dropoffLabel(business.accepts_public_dropoff)}
        </span>
        {visibleMaterials.map((material) => (
          <span key={material.id} className="status-chip sm:text-xs">
            {material.name}
          </span>
        ))}
        {extraMaterials > 0 ? (
          <span className="status-chip sm:text-xs">+{extraMaterials}</span>
        ) : null}
      </div>

      <Link
        href={`/directory/${business.slug}`}
        aria-label={`View details for ${business.name}`}
        className="mt-5 inline-flex w-fit items-center gap-2 text-sm font-medium text-[var(--color-ink)] outline-none focus-visible:opacity-80"
      >
        <span className="underline decoration-[var(--color-accent)] decoration-2 underline-offset-4">
          View details
        </span>
        <span
          aria-hidden="true"
          className="transition-transform duration-200 group-hover:translate-x-1"
        >
          →
        </span>
      </Link>
    </article>
  );
}
