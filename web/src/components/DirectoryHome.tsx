"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BusinessCard from "@/components/BusinessCard";
import HeroDirectorySearch from "@/components/HeroDirectorySearch";
import { getBusinesses, type Business } from "@/lib/api";

type Material = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
};

type Props = {
  initialBusinesses: Business[];
  initialTotal: number;
  counties: string[];
  materials: Material[];
};

const PAGE_SIZE = 12;

const FILTER_KEYS = [
  "q",
  "material",
  "material_id",
  "county",
  "business_type",
  "accepts_public_dropoff",
] as const;

function resolveMaterialSlug(
  searchParams: URLSearchParams,
  materials: Material[],
): string {
  const slug = (searchParams.get("material") ?? "").trim();
  if (slug && materials.some((material) => material.slug === slug)) {
    return slug;
  }

  const idParam = searchParams.get("material_id");
  if (idParam) {
    const match = materials.find((material) => String(material.id) === idParam);
    if (match) return match.slug;
  }

  return "";
}

export default function DirectoryHome({
  initialBusinesses,
  initialTotal,
  counties,
  materials,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = (searchParams.get("q") ?? "").trim();
  const county = searchParams.get("county") ?? "";
  const dropoff = searchParams.get("accepts_public_dropoff") ?? "";
  const businessType = searchParams.get("business_type") ?? "";
  const selectedSlug = useMemo(
    () => resolveMaterialSlug(searchParams, materials),
    [searchParams, materials],
  );

  const selectedMaterial = useMemo(
    () => materials.find((material) => material.slug === selectedSlug),
    [materials, selectedSlug],
  );

  const filtersActive = Boolean(
    query || selectedSlug || county || dropoff || businessType,
  );

  const [businesses, setBusinesses] = useState(initialBusinesses);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const skipInitialUnfilteredFetch = useRef(true);
  const initialTotalRef = useRef(initialTotal);

  function replaceFilterParams(
    patch: Record<string, string | null | undefined>,
  ) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(patch)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    // Prefer slug-based material links; drop legacy id when slug is set/cleared.
    if ("material" in patch) {
      params.delete("material_id");
    }

    const next = params.toString();
    router.replace(next ? `/?${next}` : "/", { scroll: false });
  }

  // Remember the current filters so the business page's "Back to directory"
  // link can restore them.
  useEffect(() => {
    try {
      sessionStorage.setItem("directory-params", searchParams.toString());
    } catch {
      // storage unavailable: the back link falls back to the plain directory
    }
  }, [searchParams]);

  useEffect(() => {
    // The server renders the unfiltered first page. Skip only that duplicate
    // request. A query or filter already in the URL still needs a fetch,
    // including when search params arrive after the first render.
    if (skipInitialUnfilteredFetch.current) {
      skipInitialUnfilteredFetch.current = false;
      // Skip only the duplicate unfiltered first page. If the URL already has
      // a query/filter, or the server could not load listings, fetch now.
      if (
        !query &&
        !county &&
        !dropoff &&
        !businessType &&
        !selectedMaterial &&
        initialTotalRef.current > 0
      ) {
        return;
      }
    }

    let cancelled = false;

    async function loadFilteredBusinesses() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: "1",
        page_size: String(PAGE_SIZE),
      });

      if (query) params.set("q", query);
      if (county) params.set("county", county);
      if (dropoff) params.set("accepts_public_dropoff", dropoff);
      if (businessType) params.set("business_type", businessType);
      if (selectedMaterial) {
        params.set("material_id", String(selectedMaterial.id));
      }

      try {
        const result = await getBusinesses(params);

        if (!cancelled) {
          setBusinesses(result.items);
          setTotal(result.total);
          setPage(1);
        }
      } catch {
        if (!cancelled) {
          setError("We couldn't load the directory. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadFilteredBusinesses();

    return () => {
      cancelled = true;
    };
  }, [query, county, dropoff, businessType, selectedMaterial]);

  function resetFilters() {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of FILTER_KEYS) {
      params.delete(key);
    }
    const next = params.toString();
    router.replace(next ? `/?${next}` : "/", { scroll: false });
  }

  async function loadMore() {
    if (loading || businesses.length >= total) return;

    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      page: String(page + 1),
      page_size: String(PAGE_SIZE),
    });

    if (query) params.set("q", query);
    if (county) params.set("county", county);
    if (dropoff) params.set("accepts_public_dropoff", dropoff);
    if (businessType) params.set("business_type", businessType);
    if (selectedMaterial) {
      params.set("material_id", String(selectedMaterial.id));
    }

    try {
      const result = await getBusinesses(params);

      setBusinesses((current) => [...current, ...result.items]);
      setTotal(result.total);
      setPage((current) => current + 1);
    } catch {
      setError("We couldn't load more businesses. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="directory" className="page-shell directory-listing pb-16">
      <h2 className="sr-only">Find your next step</h2>

      <div className="directory-toolbar">
        <HeroDirectorySearch className="directory-toolbar__search" />

        <div className="directory-toolbar__filters">
          <label>
            <span className="sr-only">County</span>
            <select
              value={county}
              onChange={(event) =>
                replaceFilterParams({ county: event.target.value || null })
              }
              className="select-field"
            >
              <option value="">All counties</option>
              {counties.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Business type</span>
            <select
              value={businessType}
              onChange={(event) =>
                replaceFilterParams({
                  business_type: event.target.value || null,
                })
              }
              className="select-field capitalize"
            >
              <option value="">All business types</option>
              <option value="recycler">Recycler</option>
              <option value="upcycler">Upcycler</option>
              <option value="collector">Collector</option>
              <option value="mixed">Mixed</option>
            </select>
          </label>

          <label>
            <span className="sr-only">Public drop-off</span>
            <select
              value={dropoff}
              onChange={(event) =>
                replaceFilterParams({
                  accepts_public_dropoff: event.target.value || null,
                })
              }
              className="select-field"
            >
              <option value="">Any drop-off status</option>
              <option value="yes">Accepts public drop-off</option>
              <option value="no">No public drop-off</option>
              <option value="unknown">Not confirmed</option>
            </select>
          </label>
        </div>
      </div>

      {(filtersActive || loading) && (
        <div className="directory-status">
          <div className="flex flex-wrap items-center gap-3">
            <p className="m-0 text-sm text-[var(--color-muted)]">
              {loading
                ? "Updating results…"
                : query
                  ? `${total} ${total === 1 ? "result" : "results"} for “${query}”`
                  : `${total} ${total === 1 ? "business" : "businesses"}`}
            </p>

            {selectedMaterial && (
              <button
                type="button"
                onClick={() => replaceFilterParams({ material: null })}
                aria-label={`Remove ${selectedMaterial.name} filter`}
                className="filter-chip"
              >
                {selectedMaterial.name}
                <span aria-hidden="true">×</span>
              </button>
            )}
          </div>

          {filtersActive && (
            <button
              type="button"
              onClick={resetFilters}
              className="link-accent text-sm"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="py-5 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}

      {!loading && businesses.length === 0 && !error && (
        <div className="border-b border-[var(--color-border)] py-12">
          <h3 className="text-xl font-medium">No matches just yet.</h3>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Try another material or broaden your filters.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="link-accent mt-4 text-sm"
          >
            Show all businesses
          </button>
        </div>
      )}

      <div aria-busy={loading} className="directory-results">
        {businesses.map((business) => (
          <BusinessCard key={business.id} business={business} />
        ))}
      </div>

      {businesses.length > 0 && businesses.length < total && (
        <div className="flex justify-center border-t border-[var(--color-border)] py-8">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="btn-primary min-h-12 disabled:cursor-wait"
          >
            {loading ? "Loading…" : "Load more businesses"}
          </button>
        </div>
      )}
    </section>
  );
}