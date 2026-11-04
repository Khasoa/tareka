import type { TiptapNode } from "@/lib/insights/document";
import type { EditorComparableState } from "@/lib/insights/editor/editorFormBaseline";
import {
  isMeaningfulRecoverySnapshot,
  recoverySnapshotDiffersFromServer,
} from "@/lib/insights/editor/editorFormBaseline";
import { healDocumentLinks } from "@/lib/insights/editor/linkHref";

const STORAGE_PREFIX = "tareka-insights-recovery:";

export type ArticleRecoverySnapshot = {
  savedAt: string;
  version: number;
  title: string;
  excerpt: string;
  slug: string;
  categoryId: number | null;
  publishedAt: string | null;
  bodyJson: TiptapNode;
  featuredImageKey: string | null;
  featuredImageAlt: string;
  featuredImageCaption: string;
  seoTitle?: string;
  metaDescription?: string;
};

export type RecoveryAssessment = "none" | "server_newer" | "restorable";

function storageKey(articleId: number): string {
  return `${STORAGE_PREFIX}${articleId}`;
}

export function writeArticleRecovery(
  articleId: number,
  snapshot: ArticleRecoverySnapshot,
): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(storageKey(articleId), JSON.stringify(snapshot));
  } catch {
    // Ignore quota errors — in-memory editor state still holds content.
  }
}

export function readArticleRecovery(
  articleId: number,
): ArticleRecoverySnapshot | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(articleId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ArticleRecoverySnapshot;
    return healRecoverySnapshot(parsed);
  } catch {
    return null;
  }
}

function healRecoverySnapshot(
  snapshot: ArticleRecoverySnapshot,
): ArticleRecoverySnapshot {
  return {
    ...snapshot,
    bodyJson: healDocumentLinks(snapshot.bodyJson).document,
  };
}

export function clearArticleRecovery(articleId: number): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(storageKey(articleId));
}

export function assessRecovery(
  snapshot: ArticleRecoverySnapshot | null,
  serverVersion: number,
  serverState: EditorComparableState,
): RecoveryAssessment {
  if (!snapshot) return "none";
  if (snapshot.version < serverVersion) return "server_newer";
  if (!recoverySnapshotDiffersFromServer(snapshot, serverState)) {
    return "none";
  }
  if (!isMeaningfulRecoverySnapshot(snapshot, serverState)) {
    return "none";
  }
  return "restorable";
}

export function snapshotFromFormState(
  articleId: number,
  state: {
    version: number;
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
  },
): ArticleRecoverySnapshot {
  return {
    savedAt: new Date().toISOString(),
    version: state.version,
    title: state.title,
    excerpt: state.excerpt,
    slug: state.slug,
    categoryId: state.categoryId,
    publishedAt: state.publishedAt || null,
    bodyJson: state.bodyJson,
    featuredImageKey: state.featuredImageKey,
    featuredImageAlt: state.featuredImageAlt,
    featuredImageCaption: state.featuredImageCaption,
    seoTitle: state.seoTitle,
    metaDescription: state.metaDescription,
  };
}
