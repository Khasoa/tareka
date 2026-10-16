import Image from "next/image";
import Link from "next/link";

import Header from "@/components/Header";
import { getAllInsights } from "@/lib/insights";

export const metadata = {
  title: "Insights | tareka",
  description:
    "Explore materials, recycling, recovery methods and Kenya&apos;s recovery systems.",
};

function formatPublishedDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export default function InsightsIndexPage() {
  const insights = getAllInsights();

  return (
    <>
      <Header />

      <main className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        <header className="max-w-2xl border-b border-[var(--color-border-strong)] pb-8">
          <p className="kicker">
            Learn about recovery
          </p>

          <h1 className="page-heading mt-3">
            Insights
          </h1>

          <p className="mt-4 leading-7 text-[var(--color-muted)]">
            Understand the materials we use, what happens after collection,
            and the people and systems that help keep useful materials in
            circulation.
          </p>
        </header>

        {insights.length > 0 ? (
          <section
            aria-label="Published insights"
            className="mt-10 grid gap-6 sm:grid-cols-2"
          >
            {insights.map((insight) => (
              <article
                key={insight.slug}
                className="overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] transition-transform hover:-translate-y-0.5"
              >
                {insight.cover_image && (
                  <Link
                    href={`/insights/${insight.slug}`}
                    aria-label={`Read ${insight.title}`}
                    className="block"
                  >
                    <Image
                      src={insight.cover_image}
                      alt={insight.image_alt ?? ""}
                      width={1200}
                      height={675}
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="aspect-[16/9] w-full object-cover"
                    />
                  </Link>
                )}

                <div className="p-6 sm:p-7">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-muted)]">
                    <span className="kicker text-xs font-semibold">
                      {insight.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <time dateTime={insight.published_at}>
                      {formatPublishedDate(insight.published_at)}
                    </time>
                  </div>

                  <h2 className="mt-3 text-xl font-semibold leading-snug text-[var(--color-heading)]">
                    <Link
                      href={`/insights/${insight.slug}`}
                      className="underline decoration-transparent decoration-2 underline-offset-4 transition-colors hover:decoration-[var(--color-accent)]"
                    >
                      {insight.title}
                    </Link>
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                    {insight.excerpt}
                  </p>

                  <Link
                    href={`/insights/${insight.slug}`}
                    className="link-accent mt-5 inline-flex items-center gap-2 text-sm font-semibold"
                  >
                    Read article <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <div className="mt-10 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-[var(--color-heading)]">
              Articles are being prepared
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--color-muted)]">
              We&apos;re preparing practical, researched information about
              materials and recovery. Check back soon.
            </p>
          </div>
        )}

        <div className="mt-12 border-t border-[var(--color-border-strong)] pt-6">
          <Link
            href="/#directory"
            className="link-accent text-sm font-medium"
          >
            Explore the recovery directory →
          </Link>
        </div>
      </main>
    </>
  );
}