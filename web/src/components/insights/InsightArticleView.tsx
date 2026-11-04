"use client";

import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";

import DirectoryCTA from "@/components/DirectoryCTA";
import Header from "@/components/Header";
import { LinkWithArrow } from "@/components/LinkWithArrow";
import { CategoryLabel } from "@/components/insights/CategoryLabel";
import { InsightArticleBody } from "@/components/insights/InsightArticleBody";
import { insightCategoryColor } from "@/lib/insightCategoryTokens";
import {
  resolveInsightDirectoryCta,
  type InsightDirectoryCtaFields,
} from "@/lib/insights/insightDirectoryCta";

export type InsightArticleViewModel = InsightDirectoryCtaFields & {
  title: string;
  excerpt: string;
  categoryName: string;
  publishedAt: string | null;
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
  featuredImageCaption: string | null;
  bodyJson: Record<string, unknown>;
};

function formatPublishedDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

type InsightArticleViewProps = {
  article: InsightArticleViewModel;
  showHeader?: boolean;
  showBackLink?: boolean;
  previewBanner?: ReactNode;
};

export function InsightArticleView({
  article,
  showHeader = true,
  showBackLink = true,
  previewBanner,
}: InsightArticleViewProps) {
  const categoryAccent = article.categoryName
    ? insightCategoryColor(article.categoryName)
    : "var(--color-border)";
  const directoryCta = resolveInsightDirectoryCta(article);

  return (
    <>
      {showHeader && <Header />}
      {previewBanner}

      <main
        className="insight-article-page mx-auto w-full max-w-[var(--content-max-width)] px-5 py-10 sm:px-8 sm:py-14 lg:px-12"
        style={
          {
            "--insight-article-accent": categoryAccent,
          } as CSSProperties
        }
      >
        <header className="insight-article-header pb-2 lg:pb-4">
          <div className="insight-article-header__grid">
            {showBackLink ? (
              <LinkWithArrow
                href="/insights"
                arrow="←"
                arrowPosition="before"
                className="insight-article-back"
                underlineClassName="link-text-underline insight-article-back__text"
              >
                Insights
              </LinkWithArrow>
            ) : null}

            <h1 className="insight-article-title">
              {article.title || "Untitled article"}
            </h1>

            <div className="insight-article-meta">
              {article.categoryName ? (
                <CategoryLabel category={article.categoryName} />
              ) : null}
              {article.publishedAt ? (
                <p className="insight-article-meta__date">
                  <time dateTime={article.publishedAt}>
                    {formatPublishedDate(article.publishedAt)}
                  </time>
                </p>
              ) : null}
            </div>

            {article.excerpt ? (
              <p className="insight-article-intro">{article.excerpt}</p>
            ) : null}
          </div>
        </header>

        <div className="insight-article-content">
          {article.featuredImageUrl ? (
            <figure className="insight-article-featured">
              <div className="insight-article-featured__frame">
                <Image
                  src={article.featuredImageUrl}
                  alt={article.featuredImageAlt ?? ""}
                  width={1200}
                  height={900}
                  sizes="(max-width: 1024px) 100vw, 70vw"
                  className="insight-article-featured__image"
                />
              </div>
              {article.featuredImageCaption ? (
                <figcaption className="insight-article-featured__caption">
                  {article.featuredImageCaption}
                </figcaption>
              ) : null}
            </figure>
          ) : null}

          <InsightArticleBody bodyJson={article.bodyJson} />

          <div className="insight-article__prose mt-8">
            <DirectoryCTA
              href={directoryCta.href}
              label={directoryCta.label}
            />
          </div>
        </div>
      </main>
    </>
  );
}
