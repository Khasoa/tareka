import Link from "next/link";

import { getBusiness } from "@/lib/api";

type BusinessPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BusinessPage({ params }: BusinessPageProps) {
  const { slug } = await params;
  const business = await getBusiness(slug);
  const primaryLocation = business.locations[0];

  return (
    <main className="min-h-screen p-10">
      <Link href="/directory" className="underline">
        ← Back to directory
      </Link>

      <article className="mt-8">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-bold">{business.name}</h1>
          <span className="rounded-full border px-2 py-1 text-xs capitalize">
            {business.verification_status}
          </span>
        </div>

        <p className="mt-3 capitalize">{business.business_type}</p>

        {primaryLocation && (
          <p className="mt-2">
            {primaryLocation.town ? `${primaryLocation.town}, ` : ""}
            {primaryLocation.county}
          </p>
        )}

        <p className="mt-4">Public drop-off: {business.accepts_public_dropoff}</p>
        <p className="mt-1 text-sm text-gray-500">
          Materials accepted may vary — call before you go.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {business.phone && (
            <a href={`tel:${business.phone}`} className="rounded border px-4 py-2">
              Call
            </a>
          )}
          {business.phone && (
            <a
              href={`https://wa.me/${business.phone.replace(/\D/g, "")}`}
              className="rounded border px-4 py-2"
            >
              WhatsApp
            </a>
          )}
          {business.website_url && (
            <a href={business.website_url} className="rounded border px-4 py-2" target="_blank">
              Website
            </a>
          )}
        </div>

        {business.description && <p className="mt-6 max-w-2xl">{business.description}</p>}

        {business.materials.length > 0 && (
          <section className="mt-8">
            <h2 className="text-2xl font-semibold">Materials</h2>
            <ul className="mt-3 list-disc pl-6">
              {business.materials.map((material) => (
                <li key={material.id}>{material.name}</li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </main>
  );
}