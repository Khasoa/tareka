"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import type { InsightSummary } from "@/lib/insights";

function formatPublishedDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

type Props = {
  insights: InsightSummary[];
};

export default function InsightsIndex({ insights }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = (searchParams.get("category") ?? "").trim();

  const categories = useMemo(() => {
    const unique = [...new Set(insights.map((item) => item.category))].sort();
    return unique;
  }, [insights]);

  const filtered = useMemo(() => {
    if (!activeCategory) return insights;
    return insights.filter((item) => item.category === activeCategory);
  }, [activeCategory, insights]);

  function selectCategory(category: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const [featured, ...rest] = filtered;

  return (
    <main className="mx-auto w-full max-w-[var(--content-max-width)] px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
      <header className="grid gap-6 border-b border-[var(--color-border)] pb-10 sm:gap-8 lg:grid-cols-12 lg:items-end lg:pb-12">
        <div className="order-2 max-w-md lg:order-1 lg:col-span-5">
          <p className="kicker">Learn about recovery</p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)] sm:text-[0.95rem]">
            Understand the materials we use, what happens after collection,
            and the people and systems that help keep useful materials in
            circulation.
          </p>
        </div>

        <h1 className="insights-title order-1 lg:order-2 lg:col-span-7 lg:text-right">
          Insights
        </h1>
      </header>

      {insights.length > 0 ? (
        <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-8">
          {categories.length > 0 ? (
            <aside className="lg:col-span-3">
              <p className="text-sm font-medium text-[var(--color-ink)]">
                Categories
              </p>
              <div
                className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t border-[var(--color-border)] pt-3 lg:flex-col lg:gap-y-2.5"
                role="toolbar"
                aria-label="Filter by category"
              >
                <button
                  type="button"
                  onClick={() => selectCategory(null)}
                  aria-pressed={!activeCategory}
                  className={`insights-category ${!activeCategory ? "is-active" : ""}`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => selectCategory(category)}
                    aria-pressed={activeCategory === category}
                    className={`insights-category ${
                      activeCategory === category ? "is-active" : ""
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </aside>
          ) : null}

          <section
            aria-label="Published insights"
            className={categories.length > 0 ? "lg:col-span-9" : "lg:col-span-12"}
          >
            {filtered.length > 0 ? (
              <>
                {featured ? <FeaturedInsight insight={featured} /> : null}

                {rest.length > 0 ? (
                  <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
                    {rest.map((insight) => (
                      <InsightCard key={insight.slug} insight={insight} />
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="max-w-md py-4">
                <h2 className="text-lg font-medium text-[var(--color-heading)]">
                  No articles in this category yet
                </h2>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  Try another category or view all articles.
                </p>
                <button
                  type="button"
                  onClick={() => selectCategory(null)}
                  className="link-accent mt-4 text-sm font-medium"
                >
                  Show all articles
                </button>
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="mt-12 max-w-xl">
          <h2 className="text-lg font-medium text-[var(--color-heading)]">
            Articles are being prepared
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            We&apos;re preparing practical, researched information about
            materials and recovery. Check back soon.
          </p>
        </div>
      )}

      <div className="mt-16 border-t border-[var(--color-border)] pt-6">
        <Link href="/#directory" className="link-row text-sm font-medium">
          <span className="link-accent">Explore the recovery directory</span>
          <span className="link-arrow" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </main>
  );
}

function InsightMeta({ insight }: { insight: InsightSummary }) {
  return (
    <p className="font-meta text-[11px] text-[var(--color-muted)]">
      <span className="insight-mark" aria-hidden="true" />
      <span>{insight.category}</span>
      <span aria-hidden="true"> · </span>
      <time dateTime={insight.published_at}>
        {formatPublishedDate(insight.published_at)}
      </time>
    </p>
  );
}

function FeaturedInsight({ insight }: { insight: InsightSummary }) {
  return (
    <article className={insight.cover_image ? "" : "border-t border-[var(--color-ink)] pt-5"}>
      {insight.cover_image ? (
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
            sizes="(max-width: 1024px) 100vw, 70vw"
            className="aspect-[16/9] w-full object-cover"
          />
        </Link>
      ) : null}

      <div className={`max-w-2xl ${insight.cover_image ? "mt-5" : ""}`}>
        <InsightMeta insight={insight} />
        <h2 className="mt-2 text-[1.35rem] font-medium leading-snug tracking-tight text-[var(--color-heading)] sm:text-[1.65rem]">
          <Link
            href={`/insights/${insight.slug}`}
            className="hover:text-[var(--color-muted)]"
          >
            {insight.title}
          </Link>
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted)] sm:text-[0.95rem]">
          {insight.excerpt}
        </p>
        <Link
          href={`/insights/${insight.slug}`}
          className="link-row mt-5 text-sm font-medium"
        >
          <span className="link-accent">Read article</span>
          <span className="link-arrow" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </article>
  );
}

function InsightCard({ insight }: { insight: InsightSummary }) {
  return (
    <article>
      {insight.cover_image ? (
        <Link
          href={`/insights/${insight.slug}`}
          aria-label={`Read ${insight.title}`}
          className="block"
        >
          <Image
            src={insight.cover_image}
            alt={insight.image_alt ?? ""}
            width={800}
            height={500}
            sizes="(max-width: 640px) 100vw, 30vw"
            className="aspect-[4/3] w-full object-cover"
          />
        </Link>
      ) : (
        <div className="insight-fallback py-0" aria-hidden="true">
          <span className="mb-3 inline-block h-1.5 w-1.5 bg-[var(--color-accent)]" />
        </div>
      )}

      <div className="mt-4 border-t border-[var(--color-ink)] pt-3">
        <h2 className="text-base font-medium leading-snug tracking-tight text-[var(--color-heading)]">
          <Link
            href={`/insights/${insight.slug}`}
            className="hover:text-[var(--color-muted)]"
          >
            {insight.title}
          </Link>
        </h2>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--color-muted)]">
          {insight.excerpt}
        </p>
        <div className="mt-3">
          <InsightMeta insight={insight} />
        </div>
      </div>
    </article>
  );
}
