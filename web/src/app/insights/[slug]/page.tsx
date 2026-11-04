import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InsightArticleView } from "@/components/insights/InsightArticleView";
import {
  fetchAllPublishedInsightSummaries,
  fetchPublishedInsightBySlug,
  isValidInsightSlug,
  type PublicInsightDetail,
} from "@/lib/publicInsightsApi";
import { pageMetadata } from "@/lib/metadata";

type InsightPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const items = await fetchAllPublishedInsightSummaries({ revalidate: false });
  return items.map((item) => ({ slug: item.slug }));
}

function toViewModel(article: PublicInsightDetail) {
  return {
    title: article.title,
    excerpt: article.excerpt,
    categoryName: article.category,
    publishedAt: article.published_at,
    featuredImageUrl: article.featured_image_url,
    featuredImageAlt: article.featured_image_alt,
    featuredImageCaption: article.featured_image_caption,
    bodyJson: article.body_json,
  };
}

export async function generateMetadata({
  params,
}: InsightPageProps): Promise<Metadata> {
  const { slug } = await params;

  if (!isValidInsightSlug(slug)) {
    notFound();
  }

  const article = await fetchPublishedInsightBySlug(slug);

  if (!article) {
    notFound();
  }

  const titleSegment = article.seo_title ?? article.title;
  const description = article.meta_description ?? article.excerpt;

  return pageMetadata({
    title: titleSegment,
    description,
    path: `/insights/${article.slug}`,
    openGraph: {
      type: "article",
      title: titleSegment,
      ...(article.featured_image_url
        ? { images: [article.featured_image_url] }
        : {}),
    },
  });
}

export default async function InsightPage({ params }: InsightPageProps) {
  const { slug } = await params;

  if (!isValidInsightSlug(slug)) {
    notFound();
  }

  const article = await fetchPublishedInsightBySlug(slug);

  if (!article) {
    notFound();
  }

  return <InsightArticleView article={toViewModel(article)} />;
}
