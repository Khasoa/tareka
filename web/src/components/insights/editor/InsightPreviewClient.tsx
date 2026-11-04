"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { InsightArticleView } from "@/components/insights/InsightArticleView";
import { getInsightArticle, type InsightArticleDetail } from "@/lib/adminInsightsApi";

type InsightPreviewClientProps = {
  articleId: number;
};

export function InsightPreviewClient({ articleId }: InsightPreviewClientProps) {
  const [article, setArticle] = useState<InsightArticleDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError("");
      try {
        const data = await getInsightArticle(articleId, {
          redirectOnUnauthorized: true,
        });
        if (!cancelled) setArticle(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load preview.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-10 text-sm text-[var(--color-muted)]">
        Loading preview…
      </main>
    );
  }

  if (error || !article) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-10">
        <p role="alert" className="alert-error">
          {error || "Preview unavailable."}
        </p>
        <Link
          href={`/admin/insights/${articleId}/edit`}
          className="mt-4 inline-block text-sm font-semibold"
        >
          ← Back to editor
        </Link>
      </main>
    );
  }

  return (
    <InsightArticleView
      article={{
        title: article.title,
        excerpt: article.excerpt,
        categoryName: article.category_name ?? "",
        publishedAt: article.published_at,
        featuredImageUrl: article.featured_image_url,
        featuredImageAlt: article.featured_image_alt,
        featuredImageCaption: article.featured_image_caption,
        bodyJson: article.body_json,
      }}
      showBackLink={false}
      previewBanner={
        <div className="border-b border-[var(--color-border-strong)] bg-[var(--color-accent-soft)] px-5 py-3 text-center text-sm">
          <span className="font-semibold">Draft preview</span>
          <span className="mx-2 text-[var(--color-muted)]">·</span>
          <Link
            href={`/admin/insights/${articleId}/edit`}
            className="font-semibold underline"
          >
            Back to editor
          </Link>
        </div>
      }
    />
  );
}
