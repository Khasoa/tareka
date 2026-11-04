import type { TiptapNode } from "@/lib/insights/document";
import { emptyInsightDocument } from "@/lib/insights/document";
import type { ArticleRecoverySnapshot } from "@/lib/insights/editor/recovery";

export type EditorComparableState = {
  title: string;
  excerpt: string;
  slug: string;
  categoryId: number | null;
  publishedAt: string;
  bodyJson: TiptapNode;
  featuredImageKey: string | null;
  featuredImageAlt: string;
  featuredImageCaption: string;
  seoTitle: string;
  metaDescription: string;
};

function stableStringify(value: unknown): string {
  return JSON.stringify(value);
}

export function editorStatesEqual(
  a: EditorComparableState,
  b: EditorComparableState,
): boolean {
  return (
    a.title === b.title &&
    a.excerpt === b.excerpt &&
    a.slug === b.slug &&
    a.categoryId === b.categoryId &&
    a.publishedAt === b.publishedAt &&
    a.featuredImageKey === b.featuredImageKey &&
    a.featuredImageAlt === b.featuredImageAlt &&
    a.featuredImageCaption === b.featuredImageCaption &&
    a.seoTitle === b.seoTitle &&
    a.metaDescription === b.metaDescription &&
    stableStringify(a.bodyJson) === stableStringify(b.bodyJson)
  );
}

export function isEmptyDraftState(state: EditorComparableState): boolean {
  const emptyDoc = emptyInsightDocument();
  return (
    !state.title.trim() &&
    !state.excerpt.trim() &&
    !state.slug.trim() &&
    state.categoryId === null &&
    !state.publishedAt &&
    !state.featuredImageKey &&
    !state.featuredImageAlt.trim() &&
    !state.featuredImageCaption.trim() &&
    stableStringify(state.bodyJson) === stableStringify(emptyDoc)
  );
}

export function recoverySnapshotDiffersFromServer(
  snapshot: ArticleRecoverySnapshot,
  server: EditorComparableState,
): boolean {
  return !editorStatesEqual(
    {
      title: snapshot.title,
      excerpt: snapshot.excerpt,
      slug: snapshot.slug,
      categoryId: snapshot.categoryId,
      publishedAt: snapshot.publishedAt ?? "",
      bodyJson: snapshot.bodyJson,
      featuredImageKey: snapshot.featuredImageKey,
      featuredImageAlt: snapshot.featuredImageAlt,
      featuredImageCaption: snapshot.featuredImageCaption,
      seoTitle: snapshot.seoTitle ?? "",
      metaDescription: snapshot.metaDescription ?? "",
    },
    server,
  );
}

export function isMeaningfulRecoverySnapshot(
  snapshot: ArticleRecoverySnapshot,
  server: EditorComparableState,
): boolean {
  if (!recoverySnapshotDiffersFromServer(snapshot, server)) {
    return false;
  }
  const asState: EditorComparableState = {
    title: snapshot.title,
    excerpt: snapshot.excerpt,
    slug: snapshot.slug,
    categoryId: snapshot.categoryId,
    publishedAt: snapshot.publishedAt ?? "",
    bodyJson: snapshot.bodyJson,
    featuredImageKey: snapshot.featuredImageKey,
    featuredImageAlt: snapshot.featuredImageAlt,
    featuredImageCaption: snapshot.featuredImageCaption,
    seoTitle: snapshot.seoTitle ?? "",
    metaDescription: snapshot.metaDescription ?? "",
  };
  return !isEmptyDraftState(asState);
}
