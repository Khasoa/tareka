"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  adminRequest,
  type VerificationQueueItem,
  type VerificationQueueResponse,
} from "@/lib/adminApi";
import {
  dropoffLabel,
  formatBusinessType,
  formatLocation,
  verificationDisplay,
} from "@/lib/publicLabels";

const BUSINESS_TYPES = [
  { value: "", label: "All types" },
  { value: "recycler", label: "Recycler" },
  { value: "upcycler", label: "Upcycler" },
  { value: "collector", label: "Collector" },
  { value: "mixed", label: "Mixed" },
];

const STATUS_FILTERS = [
  { value: "", label: "All awaiting review" },
  { value: "unverified", label: "Unverified" },
  { value: "needs_review", label: "Needs review" },
  { value: "verified", label: "Re-verification due" },
];

function queueQueryString(params: URLSearchParams) {
  const query = new URLSearchParams();
  for (const key of ["q", "county", "business_type", "verification_status", "page"]) {
    const value = params.get(key);
    if (value) {
      query.set(key, value);
    }
  }
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export default function AdminVerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<VerificationQueueItem[]>([]);
  const [counties, setCounties] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filters = useMemo(
    () => ({
      q: searchParams.get("q") ?? "",
      county: searchParams.get("county") ?? "",
      business_type: searchParams.get("business_type") ?? "",
      verification_status: searchParams.get("verification_status") ?? "",
      page: Math.max(1, Number(searchParams.get("page") ?? "1") || 1),
    }),
    [searchParams],
  );

  const returnQuery = useMemo(
    () => queueQueryString(searchParams),
    [searchParams],
  );

  const updateFilters = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
      }
      if (!("page" in updates)) {
        next.delete("page");
      }
      router.push(`/admin/verification?${next.toString()}`);
    },
    [router, searchParams],
  );

  useEffect(() => {
    let cancelled = false;
    adminRequest<string[]>("/directory/counties")
      .then((data) => {
        if (!cancelled) setCounties(data);
      })
      .catch(() => {
        /* County filter remains optional if reference data fails. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (filters.q) params.set("q", filters.q);
      if (filters.county) params.set("county", filters.county);
      if (filters.business_type) params.set("business_type", filters.business_type);
      if (filters.verification_status) {
        params.set("verification_status", filters.verification_status);
      }
      params.set("page", String(filters.page));
      params.set("page_size", "20");

      try {
        const queue = await adminRequest<VerificationQueueResponse>(
          `/api/admin/businesses/needs-verification?${params.toString()}`,
        );

        if (cancelled) return;

        setItems(queue.items);
        setTotal(queue.total);
        setTotalPages(queue.total_pages);
        setPage(queue.page);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load the verification queue.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [filters]);

  return (
    <AdminShell
      title="Business verification"
      kicker="Directory records"
      description="Review existing businesses in the directory before they appear publicly. Imported listings stay unpublished until you verify them deliberately."
    >
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-center">
          <p className="text-2xl font-semibold">{total}</p>
          <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
            Awaiting review
          </p>
        </div>
      </div>

      <form
        className="mt-8 grid gap-4 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-5 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          updateFilters({
            q: String(data.get("q") ?? "").trim(),
            county: String(data.get("county") ?? ""),
            business_type: String(data.get("business_type") ?? ""),
            verification_status: String(data.get("verification_status") ?? ""),
            page: "",
          });
        }}
      >
        <label className="text-sm font-semibold sm:col-span-2">
          Search by business name
          <input
            name="q"
            type="search"
            maxLength={100}
            defaultValue={filters.q}
            className="input-field mt-2 py-2.5"
            placeholder="e.g. Ecopost"
          />
        </label>

        <label className="text-sm font-semibold">
          County
          <select
            name="county"
            defaultValue={filters.county}
            className="input-field mt-2 py-2.5"
          >
            <option value="">All counties</option>
            {counties.map((county) => (
              <option key={county} value={county}>
                {county}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold">
          Business type
          <select
            name="business_type"
            defaultValue={filters.business_type}
            className="input-field mt-2 py-2.5"
          >
            {BUSINESS_TYPES.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold sm:col-span-2">
          Verification status
          <select
            name="verification_status"
            defaultValue={filters.verification_status}
            className="input-field mt-2 py-2.5"
          >
            {STATUS_FILTERS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <button type="submit" className="btn-primary">
            Apply filters
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => router.push("/admin/verification")}
          >
            Clear
          </button>
        </div>
      </form>

      {loading && (
        <p className="mt-8 text-sm text-[var(--color-muted)]">
          Loading verification queue…
        </p>
      )}

      {error && (
        <p role="alert" className="mt-6 alert-error">
          {error}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="mt-8 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-[var(--color-muted)]">
          No businesses match these filters.
        </p>
      )}

      <ul className="mt-8 space-y-4">
        {items.map((business) => {
          const status = verificationDisplay(business.verification_status);
          const materials =
            business.materials.length > 0
              ? business.materials.map((item) => item.name).join(", ")
              : "Not recorded";

          return (
            <li key={business.id}>
              <Link
                href={`/admin/verification/${business.id}${returnQuery}`}
                className="block rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--color-ink)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">
                      {business.name}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      {formatLocation(business.town, business.county) ||
                        "Location not recorded"}
                      {" · "}
                      {formatBusinessType(business.business_type)}
                    </p>
                  </div>
                  <span
                    className={`rounded-[var(--radius-control)] border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                      status.tone === "verified"
                        ? "border-[var(--color-border-strong)]"
                        : status.tone === "review"
                          ? "border-amber-600/40 bg-amber-50 text-amber-900"
                          : "border-[var(--color-border-strong)] bg-[var(--color-accent-soft)]"
                    }`}
                  >
                    {status.label}
                  </span>
                </div>

                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold text-[var(--color-heading)]">
                      Materials
                    </dt>
                    <dd className="mt-0.5 text-[var(--color-body)]">{materials}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[var(--color-heading)]">
                      Public drop-off
                    </dt>
                    <dd className="mt-0.5 text-[var(--color-body)]">
                      {dropoffLabel(business.accepts_public_dropoff)}
                    </dd>
                  </div>
                </dl>

                <span className="mt-4 inline-block text-sm font-semibold">
                  Review business →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {totalPages > 1 && (
        <nav
          aria-label="Verification queue pages"
          className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-5"
        >
          <p className="text-sm text-[var(--color-muted)]">
            Page {page} of {totalPages} · {total} businesses
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => updateFilters({ page: String(page - 1) })}
              className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => updateFilters({ page: String(page + 1) })}
              className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </nav>
      )}
    </AdminShell>
  );
}
