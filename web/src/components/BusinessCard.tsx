import Link from "next/link";

import VerifiedMark from "@/components/VerifiedMark";
import type { Business } from "@/lib/api";

type BusinessCardProps = { business: Business; index?: number };

export default function BusinessCard({ business, index }: BusinessCardProps) {
  const primaryLocation = business.locations[0];
  const isVerified = business.verification_status === "verified";

  return (
    <article className="rounded-2xl border-[1.5px] border-[var(--color-border-strong)] bg-white p-6 shadow-[3px_3px_0_var(--color-border-strong)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_var(--color-border-strong)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          {typeof index === "number" && (
            <p className="text-xs text-[var(--color-muted)]">{String(index + 1).padStart(2, "0")}</p>
          )}
          <h2 className="mt-1 text-lg font-semibold leading-snug">{business.name}</h2>
        </div>

        <span className="flex items-center gap-1 text-xs font-medium capitalize text-[var(--color-muted)]">
          {isVerified && <VerifiedMark />}
          {business.verification_status.replace("_", " ")}
        </span>
      </div>

      <p className="mt-2 text-sm capitalize text-[var(--color-muted)]">{business.business_type}</p>

      {primaryLocation && (
        <p className="mt-3 text-sm">
          {primaryLocation.town ? `${primaryLocation.town}, ` : ""}
          {primaryLocation.county}
        </p>
      )}

      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Public drop-off: <span className="text-[var(--color-ink)]">{business.accepts_public_dropoff}</span>
      </p>

      <Link
        href={`/directory/${business.slug}`}
        className="mt-5 inline-block text-sm font-medium underline decoration-[#B9E4C4] decoration-[3px] underline-offset-4"
      >
        View details →
      </Link>
    </article>
  );
}