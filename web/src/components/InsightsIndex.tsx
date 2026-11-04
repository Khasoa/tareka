"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { CategoryLabel } from "@/components/insights/CategoryLabel";
import { LinkWithArrow } from "@/components/LinkWithArrow";
import { useMemo, useState } from "react";

import { devInsightsGridPreview } from "@/lib/insights/devGridPreview";
import { insightCategoryDotColor } from "@/lib/insightCategoryTokens";
import type { PublicInsightSummary } from "@/lib/publicInsightsApi";

function formatPublishedDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

const CATEGORY_DISPLAY_ORDER = [
  "Foundations",
  "Material Explorations",
  "Recovery in Practice",
] as const;

function sortCategories(names: string[]) {
  return [...names].sort((a, b) => {
    const indexA = CATEGORY_DISPLAY_ORDER.indexOf(
      a as (typeof CATEGORY_DISPLAY_ORDER)[number],
    );
    const indexB = CATEGORY_DISPLAY_ORDER.indexOf(
      b as (typeof CATEGORY_DISPLAY_ORDER)[number],
    );
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
}

function compareInsights(a: PublicInsightSummary, b: PublicInsightSummary) {
  const byDate = b.published_at.localeCompare(a.published_at);
  if (byDate !== 0) return byDate;
  return b.slug.localeCompare(a.slug);
}

type Props = {
  insights: PublicInsightSummary[];
};

export default function InsightsIndex({ insights: insightsProp }: Props) {
  const searchParams = useSearchParams();
  const devGridMode = searchParams.get("devInsightsGrid");
  const insights = useMemo(() => {
    const preview = devInsightsGridPreview(devGridMode, insightsProp);
    return preview ?? insightsProp;
  }, [devGridMode, insightsProp]);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const unique = sortCategories([...new Set(insights.map((item) => item.category))]);
    return unique;
  }, [insights]);

  const filtered = useMemo(() => {
    const list = activeCategory
      ? insights.filter((item) => item.category === activeCategory)
      : insights;
    return [...list].sort(compareInsights);
  }, [activeCategory, insights]);

  const newestSlug = useMemo(() => {
    if (insights.length === 0) return null;
    return [...insights].sort(compareInsights)[0]?.slug ?? null;
  }, [insights]);

  return (
    <main className="mx-auto w-full max-w-[var(--content-max-width)] px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
      <header className="grid gap-6 pb-2 sm:gap-8 lg:grid-cols-12 lg:items-end lg:pb-4">
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
        <div className="insights-layout insights-layout--below-header">
          {categories.length > 0 ? (
            <aside className="insights-sidebar">
              <p className="text-sm font-medium text-[var(--color-ink)]">
                Categories
              </p>
              <div
                className="insights-sidebar__list"
                role="toolbar"
                aria-label="Filter by category"
              >
                <button
                  type="button"
                  onClick={() => setActiveCategory(null)}
                  aria-pressed={activeCategory === null}
                  className={`insights-category ${activeCategory === null ? "is-active" : ""}`}
                >
                  <span
                    className="insight-category-dot"
                    style={{ backgroundColor: "var(--color-accent)" }}
                    aria-hidden="true"
                  />
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    aria-pressed={activeCategory === category}
                    className={`insights-category ${
                      activeCategory === category ? "is-active" : ""
                    }`}
                  >
                    <span
                      className="insight-category-dot"
                      style={{
                        backgroundColor: insightCategoryDotColor(category),
                      }}
                      aria-hidden="true"
                    />
                    {category}
                  </button>
                ))}
              </div>
            </aside>
          ) : null}

          <div
            className={
              categories.length > 0 ? "insights-main" : "insights-main insights-main--full"
            }
          >
            {filtered.length > 0 ? (
              <section aria-label="Published insights" className="insights-grid">
                {filtered.map((insight) => (
                  <InsightCard
                    key={insight.slug}
                    insight={insight}
                    isNew={insight.slug === newestSlug}
                  />
                ))}
              </section>
            ) : (
              <div className="max-w-md py-4">
                <h2 className="text-lg font-medium text-[var(--color-heading)]">
                  Nothing here yet
                </h2>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  No articles in this category. Try another filter or view all.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveCategory(null)}
                  className="insights-inline-link mt-4 text-sm font-medium"
                >
                  View all articles
                </button>
              </div>
            )}
          </div>
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
        <LinkWithArrow
          href="/#directory"
          className="insights-inline-link text-sm font-medium"
          underlineClassName="link-text-underline"
        >
          Explore the recovery directory
        </LinkWithArrow>
      </div>
    </main>
  );
}

function InsightCard({
  insight,
  isNew,
}: {
  insight: PublicInsightSummary;
  isNew: boolean;
}) {
  const href = `/insights/${insight.slug}`;
  const label = `Read ${insight.title}`;

  return (
    <Link href={href} className="insight-card" aria-label={label}>
      <div className="insight-card__media">
        {insight.featured_image_url ? (
          <Image
            src={insight.featured_image_url}
            alt={insight.featured_image_alt ?? ""}
            width={640}
            height={480}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="insight-card__placeholder" aria-hidden="true" />
        )}
      </div>

      <div className="insight-card__body">
        <p className="insight-card__meta">
          <span className="insight-card__meta-start">
            <CategoryLabel category={insight.category} />
          </span>
          <span className="insight-card__date">
            <time dateTime={insight.published_at}>
              {formatPublishedDate(insight.published_at)}
            </time>
            {isNew ? (
              <>
                <span className="insight-card__meta-sep" aria-hidden="true">
                  ·
                </span>
                <span className="insight-card__new">New</span>
              </>
            ) : null}
          </span>
        </p>
        <h2 className="insight-card__title line-clamp-2">{insight.title}</h2>
        <p className="insight-card__excerpt line-clamp-2">{insight.excerpt}</p>
      </div>
    </Link>
  );
}
