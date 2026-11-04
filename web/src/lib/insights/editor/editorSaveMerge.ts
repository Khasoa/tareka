import type { InsightArticleDetail } from "@/lib/adminInsightsApi";
import type { TiptapNode } from "@/lib/insights/document";

/** Form fields mirrored from ArticleEditor — keep in sync when those fields change. */
export type EditorFormSnapshot = {
  title: string;
  slug: string;
  excerpt: string;
  categoryId: number | null;
  publishedAt: string;
  bodyJson: TiptapNode;
  featuredImageKey: string | null;
  featuredImageUrl: string | null;
  featuredImageAlt: string;
  featuredImageCaption: string;
  seoTitle: string;
  metaDescription: string;
  version: number;
  status: "draft" | "published";
};

export function articleDetailToFormSnapshot(
  article: InsightArticleDetail,
): EditorFormSnapshot {
  return {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    categoryId: article.category_id,
    publishedAt: article.published_at ?? "",
    bodyJson: article.body_json as TiptapNode,
    featuredImageKey: article.featured_image_key,
    featuredImageUrl: article.featured_image_url,
    featuredImageAlt: article.featured_image_alt ?? "",
    featuredImageCaption: article.featured_image_caption ?? "",
    seoTitle: article.seo_title ?? "",
    metaDescription: article.meta_description ?? "",
    version: article.version,
    status: article.status,
  };
}

/** After save/autosave: refresh server metadata but keep the editor's in-memory body. */
export function mergeSavedArticlePreservingEditorBody(
  current: EditorFormSnapshot,
  saved: InsightArticleDetail,
): EditorFormSnapshot {
  const fromServer = articleDetailToFormSnapshot(saved);
  return {
    ...fromServer,
    bodyJson: current.bodyJson,
  };
}
