"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  listInsightArticles,
  listInsightCategories,
  unpublishInsightArticle,
  deleteInsightArticle,
  type InsightArticleStatus,
  type InsightArticleSummary,
  type InsightCategory,
} from "@/lib/adminInsightsApi";
import { clearArticleRecovery } from "@/lib/insights/editor/recovery";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Nairobi",
  }).format(new Date(value));
}

export default function AdminInsightsPage() {
  const [items, setItems] = useState<InsightArticleSummary[]>([]);
  const [categories, setCategories] = useState<InsightCategory[]>([]);
  const [statusFilter, setStatusFilter] = useState<"" | InsightArticleStatus>("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [categoryList, response] = await Promise.all([
        listInsightCategories(),
        listInsightArticles({
          page,
          page_size: 20,
          status: statusFilter || undefined,
          category_id: categoryFilter ? Number(categoryFilter) : undefined,
        }),
      ]);
      setCategories(categoryList);
      setItems(response.items);
      setTotalPages(response.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load articles.");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, page, statusFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- list data is loaded when filters or page change
    void load();
  }, [load]);

  async function unpublishFromList(article: InsightArticleSummary) {
    if (!window.confirm(`Unpublish "${article.title}"?`)) return;
    setError("");
    try {
      await unpublishInsightArticle(article.id, { version: article.version });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to unpublish.");
    }
  }

  async function removeDraft(article: InsightArticleSummary) {
    if (article.status !== "draft") return;
    if (!window.confirm(`Delete draft "${article.title}" permanently?`)) return;
    setError("");
    try {
      await deleteInsightArticle(article.id);
      clearArticleRecovery(article.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete draft.");
    }
  }

  return (
    <AdminShell
      title="Insights articles"
      kicker="Insights CMS"
      description="Write, preview and publish editorial articles for the public Insights section."
    >
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <label className="text-sm font-semibold">
            Status
            <select
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value as "" | InsightArticleStatus);
              }}
              className="mt-1 block rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-paper)] px-3 py-2 text-sm font-normal"
            >
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>

          <label className="text-sm font-semibold">
            Category
            <select
              value={categoryFilter}
              onChange={(event) => {
                setPage(1);
                setCategoryFilter(event.target.value);
              }}
              className="mt-1 block rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-paper)] px-3 py-2 text-sm font-normal"
            >
              <option value="">All</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <Link
          href="/admin/insights/new"
          className="admin-btn-primary rounded-[var(--radius-control)] px-4 py-2 text-sm font-semibold"
        >
          Create article
        </Link>
      </div>

      {error && (
        <p role="alert" className="mt-6 alert-error">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-[var(--color-muted)]">Loading articles…</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-strong)] text-[var(--color-muted)]">
                <th className="py-2 pr-4 font-semibold">Title</th>
                <th className="py-2 pr-4 font-semibold">Category</th>
                <th className="py-2 pr-4 font-semibold">Status</th>
                <th className="py-2 pr-4 font-semibold">Published</th>
                <th className="py-2 pr-4 font-semibold">Updated</th>
                <th className="py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((article) => (
                <tr
                  key={article.id}
                  className="border-b border-[var(--color-border)] align-top"
                >
                  <td className="py-3 pr-4 font-medium">{article.title || "Untitled"}</td>
                  <td className="py-3 pr-4">{article.category_name ?? "—"}</td>
                  <td className="py-3 pr-4 capitalize">{article.status}</td>
                  <td className="py-3 pr-4">{formatDate(article.published_at)}</td>
                  <td className="py-3 pr-4">{formatUpdatedAt(article.updated_at)}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/insights/${article.id}/edit`}
                        className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] px-2 py-1 text-xs font-semibold"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/admin/insights/${article.id}/preview`}
                        className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] px-2 py-1 text-xs font-semibold"
                      >
                        Preview
                      </Link>
                      {article.status === "published" ? (
                        <button
                          type="button"
                          onClick={() => void unpublishFromList(article)}
                          className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] px-2 py-1 text-xs font-semibold"
                        >
                          Unpublish
                        </button>
                      ) : (
                        <Link
                          href={`/admin/insights/${article.id}/edit`}
                          className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] px-2 py-1 text-xs font-semibold"
                          title="Complete required fields in the editor before publishing."
                        >
                          Publish in editor
                        </Link>
                      )}
                      {article.status === "draft" && (
                        <button
                          type="button"
                          onClick={() => void removeDraft(article)}
                          className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] px-2 py-1 text-xs font-semibold text-[var(--color-error)]"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {items.length === 0 && (
            <p className="mt-6 text-sm text-[var(--color-muted)]">No articles yet.</p>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
                className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] px-3 py-1 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-[var(--color-muted)]">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((value) => value + 1)}
                className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] px-3 py-1 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </AdminShell>
  );
}
