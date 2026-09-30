import type { Business } from "@/lib/api";

type BusinessCardProps = { business: Business };

export default function BusinessCard({ business }: BusinessCardProps) {
  const primaryLocation = business.locations[0];

  return (
    <article className="rounded-lg border p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{business.name}</h2>
        <span className="rounded-full border px-2 py-1 text-xs capitalize">
          {business.verification_status}
        </span>
      </div>
      <p className="mt-2 text-sm capitalize">{business.business_type}</p>
      {primaryLocation && (
        <p className="mt-2 text-sm">
          {primaryLocation.town ? `${primaryLocation.town}, ` : ""}
          {primaryLocation.county}
        </p>
      )}
      <p className="mt-2 text-sm">Public drop-off: {business.accepts_public_dropoff}</p>
      <a href={`/directory/${business.slug}`} className="mt-4 inline-block underline">
        View details
      </a>
    </article>
  );
}