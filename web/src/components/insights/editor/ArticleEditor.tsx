"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { SearchAppearanceFields } from "@/components/insights/editor/SearchAppearanceFields";
import { FeaturedImageFields } from "@/components/insights/editor/FeaturedImageFields";
import {
  InsightEditor,
  type InsightEditorHandle,
} from "@/components/insights/editor/InsightEditor";
import { SessionExpiredDialog } from "@/components/insights/editor/SessionExpiredDialog";
import {
  AdminRequestError,
  isAdminUnauthorizedError,
  isAdminVersionConflict,
} from "@/lib/adminApi";
import {
  checkAdminSession,
  createInsightArticle,
  deleteInsightArticle,
  getInsightArticle,
  listInsightCategories,
  publishInsightArticle,
  unpublishInsightArticle,
  updateInsightArticle,
  type InsightArticleDetail,
  type InsightCategory,
} from "@/lib/adminInsightsApi";
import type { TiptapNode } from "@/lib/insights/document";
import { emptyInsightDocument } from "@/lib/insights/document";
import {
  assessRecovery,
  clearArticleRecovery,
  readArticleRecovery,
  snapshotFromFormState,
  writeArticleRecovery,
  type ArticleRecoverySnapshot,
} from "@/lib/insights/editor/recovery";
import {
  saveButtonLabel,
  shouldAutosaveArticle,
} from "@/lib/insights/editor/autosavePolicy";
import {
  createBodySaveSession,
  decideBodySave,
  noteUserBodyEdit,
} from "@/lib/insights/editor/bodySaveGuard";
import {
  articleDetailToFormSnapshot,
  mergeSavedArticlePreservingEditorBody,
} from "@/lib/insights/editor/editorSaveMerge";
import {
  editorStatesEqual,
  isEmptyDraftState,
  type EditorComparableState,
} from "@/lib/insights/editor/editorFormBaseline";
import { normalizeTitleSegment } from "@/lib/metadata";
import { healDocumentLinks } from "@/lib/insights/editor/linkHref";
import { applyLatestEditorBodyToForm } from "@/lib/insights/editor/articleEditorBodySync";
import { humanizeDocumentSaveError } from "@/lib/insights/editor/documentSaveErrors";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type EditorFormState = {
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

function toFormState(article: InsightArticleDetail): EditorFormState {
  return articleDetailToFormSnapshot(article);
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Nairobi",
  }).format(new Date(value));
}

function toComparable(state: EditorFormState): EditorComparableState {
  return {
    title: state.title,
    excerpt: state.excerpt,
    slug: state.slug,
    categoryId: state.categoryId,
    publishedAt: state.publishedAt,
    bodyJson: state.bodyJson,
    featuredImageKey: state.featuredImageKey,
    featuredImageAlt: state.featuredImageAlt,
    featuredImageCaption: state.featuredImageCaption,
    seoTitle: state.seoTitle,
    metaDescription: state.metaDescription,
  };
}

function initialNewDraftForm(): EditorFormState {
  return {
    title: "",
    slug: "",
    excerpt: "",
    categoryId: null,
    publishedAt: "",
    bodyJson: emptyInsightDocument(),
    featuredImageKey: null,
    featuredImageUrl: null,
    featuredImageAlt: "",
    featuredImageCaption: "",
    seoTitle: "",
    metaDescription: "",
    version: 1,
    status: "draft",
  };
}

type ArticleEditorProps =
  | { mode: "new" }
  | { mode?: "edit"; articleId: number };

export function ArticleEditor(props: ArticleEditorProps) {
  const mode = props.mode ?? "edit";
  const articleId = props.mode === "new" ? null : props.articleId;
  const router = useRouter();
  const [categories, setCategories] = useState<InsightCategory[]>([]);
  const [form, setForm] = useState<EditorFormState | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState("");
  const [saveNotice, setSaveNotice] = useState("");
  const [dirty, setDirty] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [conflictVersion, setConflictVersion] = useState<number | null>(null);
  const [editorLoad, setEditorLoad] = useState<{
    revision: number;
    document: TiptapNode;
  }>(() => ({
    revision: 0,
    document: emptyInsightDocument(),
  }));
  const [recoveryNotice, setRecoveryNotice] = useState("");
  const [pendingRecovery, setPendingRecovery] =
    useState<ArticleRecoverySnapshot | null>(null);
  const [createdArticleId, setCreatedArticleId] = useState<number | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveInFlightRef = useRef<Promise<boolean> | null>(null);
  const editorHandleRef = useRef<InsightEditorHandle | null>(null);
  const recoveryPersistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<EditorFormState | null>(null);
  const baselineRef = useRef<EditorComparableState | null>(null);
  const creatingRecord = useRef(false);
  const bodySaveSessionRef = useRef(createBodySaveSession(emptyInsightDocument()));
  const editorAcceptsBodyEditsRef = useRef(false);

  const syncDirtyFlag = useCallback((next: EditorFormState) => {
    const baseline = baselineRef.current;
    if (baseline && editorStatesEqual(toComparable(next), baseline)) {
      setDirty(false);
      setSaveStatus("idle");
      return;
    }
    setDirty(true);
    setSaveStatus("idle");
  }, []);

  const updateForm = useCallback(
    (updater: (current: EditorFormState) => EditorFormState) => {
      setForm((current) => {
        if (!current) return current;
        const next = updater(current);
        formRef.current = next;
        syncDirtyFlag(next);
        return next;
      });
    },
    [syncDirtyFlag],
  );

  const activeArticleId = createdArticleId ?? articleId;

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  const persistRecovery = useCallback(
    (state: EditorFormState) => {
      const id = activeArticleId;
      if (!id) return;
      const baseline = baselineRef.current;
      if (baseline && editorStatesEqual(toComparable(state), baseline)) {
        return;
      }
      writeArticleRecovery(
        id,
        snapshotFromFormState(id, {
          version: state.version,
          title: state.title,
          excerpt: state.excerpt,
          slug: state.slug,
          categoryId: state.categoryId,
          publishedAt: state.publishedAt,
          bodyJson: state.bodyJson,
          featuredImageKey: state.featuredImageKey,
          featuredImageAlt: state.featuredImageAlt,
          featuredImageCaption: state.featuredImageCaption,
          seoTitle: state.seoTitle,
          metaDescription: state.metaDescription,
        }),
      );
    },
    [activeArticleId],
  );

  const bumpEditorContent = useCallback((document: TiptapNode) => {
    setEditorLoad((prev) => ({
      revision: prev.revision + 1,
      document,
    }));
  }, []);

  const scheduleRecoveryPersist = useCallback(() => {
    if (recoveryPersistTimer.current) {
      clearTimeout(recoveryPersistTimer.current);
    }
    recoveryPersistTimer.current = setTimeout(() => {
      const state = formRef.current;
      if (state) persistRecovery(state);
    }, 400);
  }, [persistRecovery]);

  const handleEditorUpdate = useCallback(
    (bodyJson: TiptapNode) => {
      if (editorAcceptsBodyEditsRef.current) {
        noteUserBodyEdit(bodySaveSessionRef.current, bodyJson);
      }
      const current = formRef.current;
      if (current) {
        formRef.current = { ...current, bodyJson };
      }
      setDirty(true);
      setSaveStatus("idle");
      scheduleRecoveryPersist();
    },
    [scheduleRecoveryPersist],
  );

  const loadArticle = useCallback(async () => {
    if (articleId === null) return;
    setError("");
    setLoading(true);
    try {
      const [article, categoryList] = await Promise.all([
        getInsightArticle(articleId),
        listInsightCategories(),
      ]);
      setCategories(categoryList.filter((item) => item.is_active));
      const serverState = toFormState(article);
      baselineRef.current = toComparable(serverState);
      const localRecovery = readArticleRecovery(articleId);
      const assessment = assessRecovery(
        localRecovery,
        article.version,
        toComparable(serverState),
      );

      if (assessment === "server_newer") {
        setRecoveryNotice(
          "A local recovery copy exists, but the server has a newer version. Showing the server copy.",
        );
        setForm(serverState);
        clearArticleRecovery(articleId);
        setPendingRecovery(null);
      } else if (assessment === "restorable" && localRecovery) {
        setForm(serverState);
        setPendingRecovery(localRecovery);
      } else {
        setForm(serverState);
        if (localRecovery) {
          clearArticleRecovery(articleId);
        }
        setPendingRecovery(null);
      }
      setUpdatedAt(article.updated_at);
      setDirty(false);
      setConflictVersion(null);
      bodySaveSessionRef.current = createBodySaveSession(serverState.bodyJson);
      bumpEditorContent(serverState.bodyJson);
    } catch (err) {
      if (err instanceof AdminRequestError && err.status === 404) {
        clearArticleRecovery(articleId);
      }
      setError(
        err instanceof AdminRequestError
          ? err.message
          : "We could not load this article. Return to the list and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [articleId, bumpEditorContent]);

  useEffect(() => {
    if (mode !== "new") return;
    let cancelled = false;

    async function bootstrapNewDraft() {
      setError("");
      setLoading(true);
      try {
        const categoryList = await listInsightCategories();
        if (cancelled) return;
        setCategories(categoryList.filter((item) => item.is_active));
        const empty = initialNewDraftForm();
        baselineRef.current = toComparable(empty);
        bodySaveSessionRef.current = createBodySaveSession(empty.bodyJson);
        setForm(empty);
        formRef.current = empty;
        bumpEditorContent(empty.bodyJson);
        setUpdatedAt("");
        setDirty(false);
        setPendingRecovery(null);
        setRecoveryNotice("");
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof AdminRequestError
              ? err.message
              : "We could not open the editor. Try again from the articles list.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void bootstrapNewDraft();
    return () => {
      cancelled = true;
    };
  }, [bumpEditorContent, mode]);

  useEffect(() => {
    if (mode !== "edit" || articleId === null) return;
    // Load server article when opening edit mode for a specific id.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch hydrates editor state on mount
    void loadArticle();
  }, [articleId, loadArticle, mode]);

  useEffect(() => {
    editorAcceptsBodyEditsRef.current = false;
    const frame = requestAnimationFrame(() => {
      editorAcceptsBodyEditsRef.current = true;
    });
    return () => cancelAnimationFrame(frame);
  }, [editorLoad.revision]);

  const ensureArticleRecord = useCallback(async (): Promise<number | null> => {
    if (mode === "edit" && articleId !== null) {
      return articleId;
    }
    if (createdArticleId !== null) {
      return createdArticleId;
    }
    const state = formRef.current;
    if (!state || isEmptyDraftState(toComparable(state))) {
      return null;
    }
    if (creatingRecord.current) {
      return createdArticleId;
    }
    creatingRecord.current = true;
    try {
      const created = await createInsightArticle({
        title: state.title.trim(),
      });
      setCreatedArticleId(created.id);
      router.replace(`/admin/insights/${created.id}/edit`, { scroll: false });
      setForm((current) => {
        if (!current) {
          return toFormState(created);
        }
        return {
          ...current,
          slug: created.slug,
          version: created.version,
        };
      });
      return created.id;
    } catch (err) {
      setSaveStatus("error");
      setSaveError(
        err instanceof AdminRequestError
          ? err.message
          : "We could not create this draft. Try again.",
      );
      return null;
    } finally {
      creatingRecord.current = false;
    }
  }, [articleId, createdArticleId, mode, router]);

  useEffect(() => {
    if (mode !== "new" || !dirty || !form || createdArticleId !== null) {
      return;
    }
    if (isEmptyDraftState(toComparable(form))) {
      return;
    }
    void ensureArticleRecord();
  }, [createdArticleId, dirty, ensureArticleRecord, form, mode]);

  const buildUpdatePayload = useCallback((state: EditorFormState) => {
    const decision = decideBodySave(bodySaveSessionRef.current, state.bodyJson);
    const healedBody = healDocumentLinks(state.bodyJson);
    const payload: Parameters<typeof updateInsightArticle>[1] = {
      version: state.version,
      title: state.title,
      slug: state.status === "published" ? undefined : state.slug,
      excerpt: state.excerpt,
      category_id: state.categoryId,
      published_at: state.publishedAt || null,
      featured_image_key: state.featuredImageKey,
      featured_image_alt: state.featuredImageAlt,
      featured_image_caption: state.featuredImageCaption,
      seo_title: normalizeTitleSegment(state.seoTitle.trim()) || null,
      meta_description: state.metaDescription.trim() || null,
    };
    if (decision.includeBodyJson) {
      payload.body_json = healedBody.document as Record<string, unknown>;
      if (decision.allowEmptyBody) {
        payload.allow_empty_body = true;
      }
    }
    return payload;
  }, []);

  const flushEditorBodyIntoFormRef = useCallback(() => {
    const latest = editorHandleRef.current?.getDocument();
    const current = formRef.current;
    if (!latest || !current) return;
    const next = applyLatestEditorBodyToForm(
      current,
      bodySaveSessionRef.current,
      latest,
    );
    formRef.current = next;
  }, []);

  const saveDraft = useCallback(
    async (options?: { manual?: boolean }): Promise<boolean> => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
        autosaveTimer.current = null;
      }

      if (saveInFlightRef.current) {
        await saveInFlightRef.current;
      }

      flushEditorBodyIntoFormRef();

      const runSave = async (): Promise<boolean> => {
        const state = formRef.current;
        if (!state) return false;

        if (
          mode === "new" &&
          isEmptyDraftState(toComparable(state)) &&
          !options?.manual
        ) {
          return true;
        }

        const targetId = await ensureArticleRecord();
        if (!targetId) {
          if (options?.manual && mode === "new") {
            setSaveStatus("idle");
            setSaveError("");
          }
          return false;
        }

        setSaveStatus("saving");
        setSaveError("");
        setSaveNotice("");
        persistRecovery(state);

        try {
          const updated = await updateInsightArticle(
            targetId,
            buildUpdatePayload(state),
            { redirectOnUnauthorized: false },
          );
          const merged = mergeSavedArticlePreservingEditorBody(state, updated);
          setForm(merged);
          formRef.current = merged;
          baselineRef.current = toComparable(merged);
          bodySaveSessionRef.current = createBodySaveSession(merged.bodyJson);
          setUpdatedAt(updated.updated_at);
          setDirty(false);
          setSaveStatus("saved");
          setSessionExpired(false);
          setConflictVersion(null);
          clearArticleRecovery(targetId);
          setSaveNotice(updated.save_notices?.[0] ?? "");
          return true;
        } catch (err) {
          if (isAdminUnauthorizedError(err)) {
            persistRecovery(state);
            setSessionExpired(true);
            setSaveStatus("error");
            setSaveError(
              "Your session expired. Sign in again to continue saving.",
            );
            return false;
          }
          if (isAdminVersionConflict(err)) {
            const currentVersion = Number(
              (err.detail as { current_version: number }).current_version,
            );
            setConflictVersion(currentVersion);
            setSaveStatus("error");
            setSaveError(
              "This article was updated in another tab. Reload the server version or save again after reviewing.",
            );
            return false;
          }
          setSaveStatus("error");
          setSaveError(
            err instanceof AdminRequestError
              ? humanizeDocumentSaveError(err.message)
              : "We could not save your changes. Try again.",
          );
          if (options?.manual) {
            persistRecovery(state);
          }
          return false;
        }
      };

      const promise = runSave();
      saveInFlightRef.current = promise;
      try {
        return await promise;
      } finally {
        if (saveInFlightRef.current === promise) {
          saveInFlightRef.current = null;
        }
      }
    },
    [
      buildUpdatePayload,
      ensureArticleRecord,
      flushEditorBodyIntoFormRef,
      mode,
      persistRecovery,
    ],
  );

  function applyPendingRecovery() {
    if (!pendingRecovery || !form) return;
    const restoredBody = healDocumentLinks(pendingRecovery.bodyJson).document;
    const next = {
      ...form,
      title: pendingRecovery.title,
      excerpt: pendingRecovery.excerpt,
      slug: pendingRecovery.slug,
      categoryId: pendingRecovery.categoryId,
      publishedAt: pendingRecovery.publishedAt ?? "",
      bodyJson: restoredBody,
      featuredImageKey: pendingRecovery.featuredImageKey,
      featuredImageAlt: pendingRecovery.featuredImageAlt,
      featuredImageCaption: pendingRecovery.featuredImageCaption,
      version: pendingRecovery.version,
    };
    setForm(next);
    formRef.current = next;
    setDirty(true);
    setSaveStatus("idle");
    setPendingRecovery(null);
    bumpEditorContent(restoredBody);
    bodySaveSessionRef.current = createBodySaveSession(restoredBody);
  }

  function discardPendingRecovery() {
    if (activeArticleId) {
      clearArticleRecovery(activeArticleId);
    }
    setPendingRecovery(null);
  }

  useEffect(() => {
    if (!dirty || !form) return;
    persistRecovery(form);
  }, [dirty, form, persistRecovery]);

  useEffect(() => {
    if (!dirty || !shouldAutosaveArticle(formRef.current?.status ?? "draft")) {
      return;
    }
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      void saveDraft();
    }, 1800);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [dirty, saveDraft]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      const state = formRef.current;
      if (dirty && state?.status === "published") {
        event.preventDefault();
        event.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  async function handlePublish() {
    if (!form) return;
    if (form.featuredImageKey && !form.featuredImageAlt.trim()) {
      setSaveError("Add alt text before publishing an article with a featured image.");
      return;
    }
    const saved = await saveDraft({ manual: true });
    if (!saved) {
      setSaveError(
        (current) =>
          current ||
          "We could not save your changes. Fix any issues above, then try publishing again.",
      );
      return;
    }
    const latest = formRef.current;
    if (!latest) return;
    try {
      const targetId = activeArticleId;
      if (!targetId) return;
      const published = await publishInsightArticle(targetId, {
        version: latest.version,
        published_at: latest.publishedAt || null,
      });
      const merged = mergeSavedArticlePreservingEditorBody(latest, published);
      setForm(merged);
      formRef.current = merged;
      baselineRef.current = toComparable(merged);
      setUpdatedAt(published.updated_at);
      setDirty(false);
      setSaveStatus("saved");
    } catch (err) {
      setSaveError(
        err instanceof AdminRequestError
          ? humanizeDocumentSaveError(err.message)
          : err instanceof Error
            ? err.message
            : "Publish failed.",
      );
    }
  }

  async function handleUnpublish() {
    if (!form) return;
    if (!window.confirm("Unpublish this article? It will return to draft status.")) {
      return;
    }
    try {
      const targetId = activeArticleId;
      if (!targetId) return;
      const current = formRef.current ?? form;
      const updated = await unpublishInsightArticle(targetId, {
        version: form.version,
      });
      const merged = mergeSavedArticlePreservingEditorBody(current, updated);
      setForm(merged);
      formRef.current = merged;
      baselineRef.current = toComparable(merged);
      setUpdatedAt(updated.updated_at);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unpublish failed.");
    }
  }

  async function handleDeleteDraft() {
    if (!form || form.status !== "draft") return;
    if (
      !window.confirm(
        "Delete this draft permanently? This cannot be undone.",
      )
    ) {
      return;
    }
    try {
      const targetId = activeArticleId;
      if (!targetId) return;
      await deleteInsightArticle(targetId);
      clearArticleRecovery(targetId);
      router.push("/admin/insights");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  async function handleResumeSession() {
    const ok = await checkAdminSession();
    if (!ok) {
      setSaveError("Still signed out. Complete sign-in in the other tab first.");
      return;
    }
    setSessionExpired(false);
    await saveDraft({ manual: true });
  }

  async function reloadFromServer() {
    if (articleId === null) return;
    await loadArticle();
  }

  const statusLabel = useMemo(() => {
    if (saveStatus === "saving") return "Saving…";
    if (saveStatus === "saved" && !dirty) return "Saved";
    if (dirty) return "Unsaved changes";
    return "Up to date";
  }, [dirty, saveStatus]);

  if (loading || !form) {
    return (
      <AdminShell title="Article editor" kicker="Insights CMS">
        {loading ? (
          <p className="mt-8 text-sm text-[var(--color-muted)]">Loading article…</p>
        ) : (
          error && (
            <p role="alert" className="mt-8 alert-error">
              {error}
            </p>
          )
        )}
      </AdminShell>
    );
  }

  const slugLocked = form.status === "published";
  const previewHref =
    activeArticleId !== null
      ? `/admin/insights/${activeArticleId}/preview`
      : null;

  return (
    <AdminShell
      title={form.title.trim() || "Untitled article"}
      kicker="Insights CMS"
      description={
        updatedAt
          ? `Last updated ${formatUpdatedAt(updatedAt)} · ${form.status === "published" ? "Published" : "Draft"}`
          : "New draft — your first edit will create the article."
      }
    >
      <SessionExpiredDialog open={sessionExpired} onResume={handleResumeSession} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/insights"
            className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] px-3 py-2 text-sm font-semibold"
          >
            ← Articles
          </Link>
          {previewHref ? (
            <Link
              href={previewHref}
              className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] px-3 py-2 text-sm font-semibold"
            >
              Preview
            </Link>
          ) : (
            <span className="rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-muted)]">
              Preview
            </span>
          )}
        </div>
        <p className="text-sm text-[var(--color-muted)]" aria-live="polite">
          {statusLabel}
          {form.status === "published" && dirty && (
            <span className="ml-2 font-semibold text-[var(--color-heading)]">
              Unsaved changes
            </span>
          )}
        </p>
      </div>

      {recoveryNotice && (
        <p className="mt-4 text-sm text-[var(--color-muted)]">{recoveryNotice}</p>
      )}

      {pendingRecovery && (
        <div className="mt-4 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-accent-soft)] px-4 py-3 text-sm">
          <p>Unsaved work from this browser is available.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={applyPendingRecovery}
              className="admin-btn-primary rounded-[var(--radius-control)] px-3 py-2 text-sm font-semibold"
            >
              Restore my unsaved version
            </button>
            <button
              type="button"
              onClick={discardPendingRecovery}
              className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold"
            >
              Discard it
            </button>
          </div>
        </div>
      )}

      {saveNotice && (
        <p className="mt-4 text-sm text-[var(--color-muted)]">{saveNotice}</p>
      )}

      {(error || saveError || conflictVersion !== null) && (
        <div className="mt-4 space-y-2">
          {error && (
            <p role="alert" className="alert-error">
              {error}
            </p>
          )}
          {saveError && (
            <p role="alert" className="alert-error">
              {saveError}
            </p>
          )}
          {conflictVersion !== null && (
            <div className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-accent-soft)] p-4 text-sm">
              <p className="font-semibold">Version conflict</p>
              <p className="mt-1">
                The server now has version {conflictVersion}. Your editor content is unchanged.
              </p>
              <button
                type="button"
                onClick={reloadFromServer}
                className="mt-3 admin-btn-primary rounded-[var(--radius-control)] px-3 py-2 text-sm font-semibold"
              >
                Reload server version
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Title
            <input
              value={form.title}
              onChange={(event) => {
                updateForm((current) => ({ ...current, title: event.target.value }));
              }}
              className="mt-1 w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-paper)] px-3 py-2 text-sm font-normal"
            />
          </label>

          <label className="block text-sm font-semibold">
            Slug {slugLocked && <span className="font-normal text-[var(--color-muted)]">(locked)</span>}
            <input
              value={form.slug}
              disabled={slugLocked}
              onChange={(event) => {
                updateForm((current) => ({ ...current, slug: event.target.value }));
              }}
              className="mt-1 w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-paper)] px-3 py-2 text-sm font-normal disabled:opacity-60"
            />
          </label>
        </div>

        <label className="block text-sm font-semibold">
          Excerpt
          <textarea
            value={form.excerpt}
            rows={3}
            onChange={(event) => {
              updateForm((current) => ({ ...current, excerpt: event.target.value }));
            }}
            className="mt-1 w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-paper)] px-3 py-2 text-sm font-normal"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Category
            <select
              value={form.categoryId ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                updateForm((current) => ({
                  ...current,
                  categoryId: value ? Number(value) : null,
                }));
              }}
              className="mt-1 w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-paper)] px-3 py-2 text-sm font-normal"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold">
            Publication date
            <input
              type="date"
              value={form.publishedAt}
              onChange={(event) => {
                updateForm((current) => ({
                  ...current,
                  publishedAt: event.target.value,
                }));
              }}
              className="mt-1 w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-paper)] px-3 py-2 text-sm font-normal"
            />
          </label>
        </div>

        <InsightEditor
          ref={editorHandleRef}
          content={editorLoad.document}
          contentLoadRevision={editorLoad.revision}
          onUpdate={handleEditorUpdate}
        />

        <SearchAppearanceFields
          seoTitle={form.seoTitle}
          metaDescription={form.metaDescription}
          onSeoTitleChange={(value) => {
            updateForm((current) => ({ ...current, seoTitle: value }));
          }}
          onMetaDescriptionChange={(value) => {
            updateForm((current) => ({ ...current, metaDescription: value }));
          }}
        />

        <FeaturedImageFields
          imageUrl={form.featuredImageUrl}
          imageKey={form.featuredImageKey}
          altText={form.featuredImageAlt}
          caption={form.featuredImageCaption}
          onAltChange={(value) => {
            updateForm((current) => ({ ...current, featuredImageAlt: value }));
          }}
          onCaptionChange={(value) => {
            updateForm((current) => ({
              ...current,
              featuredImageCaption: value,
            }));
          }}
          onUploaded={(uploaded) => {
            updateForm((current) => ({
              ...current,
              featuredImageKey: uploaded.storage_key,
              featuredImageUrl: uploaded.public_url,
            }));
          }}
          onRemove={() => {
            updateForm((current) => ({
              ...current,
              featuredImageKey: null,
              featuredImageUrl: null,
              featuredImageAlt: "",
              featuredImageCaption: "",
            }));
          }}
        />

        <div className="flex flex-wrap gap-3 border-t border-[var(--color-border)] pt-6">
          <button
            type="button"
            onClick={() => void saveDraft({ manual: true })}
            className={`rounded-[var(--radius-control)] px-4 py-2 text-sm font-semibold ${
              form.status === "published" && dirty
                ? "admin-btn-primary rounded-[var(--radius-control)] px-4 py-2 text-sm font-semibold"
                : "rounded-[var(--radius-control)] border border-[var(--color-border-strong)] px-4 py-2 text-sm font-semibold"
            }`}
          >
            {saveButtonLabel(form.status)}
          </button>
          {form.status === "draft" ? (
            <>
              <button
                type="button"
                onClick={() => void handlePublish()}
                className="admin-btn-primary rounded-[var(--radius-control)] px-4 py-2 text-sm font-semibold"
              >
                Publish
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteDraft()}
                className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] px-4 py-2 text-sm font-semibold text-[var(--color-error)]"
              >
                Delete draft
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void handleUnpublish()}
              className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] px-4 py-2 text-sm font-semibold"
            >
              Unpublish
            </button>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
