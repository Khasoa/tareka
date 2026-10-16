"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MaterialsExhibition from "@/components/MaterialsExhibition";
import BusinessCard from "@/components/BusinessCard";
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

  useEffect(() => {
    // The server renders the unfiltered first page. Skip only that duplicate
    // request. A query or filter already in the URL still needs a fetch,
    // including when search params arrive after the first render.
    if (skipInitialUnfilteredFetch.current) {
      (window as unknown as { __tareka?: string }).__tareka =
        `skip query=${query}`;
      skipInitialUnfilteredFetch.current = false;
      if (!query && !county && !dropoff && !businessType && !selectedMaterial) {
        return;
      }
    }

    (window as unknown as { __tareka?: string }).__tareka = `fetch query=${query}`;
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

  function selectMaterial(slug: string) {
    replaceFilterParams({ material: slug || null });
  }

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
    <>
      <MaterialsExhibition
        selectedSlug={selectedSlug}
        onSelectMaterial={selectMaterial}
      />

      <section
        id="directory"
        className="mx-auto max-w-[var(--content-max-width)] scroll-mt-6 px-5 pb-16 pt-8 sm:px-8 sm:pt-12 lg:px-12"
      >
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-border)] pb-5">
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-muted)] sm:text-xs">
              The directory
            </p>
            <h2 className="section-heading">
              Find your next step.
            </h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {loading
                ? "Updating results…"
                : query
                  ? `${total} ${total === 1 ? "result" : "results"} for “${query}”`
                  : `${total} businesses to explore`}
            </p>
          </div>

          {filtersActive && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm underline decoration-[var(--color-accent)] decoration-2 underline-offset-4"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="grid gap-3 border-b border-[var(--color-border)] py-5 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-2 text-xs text-[var(--color-muted)]">
            County
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

          <label className="flex flex-col gap-2 text-xs text-[var(--color-muted)]">
            Public drop-off
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

          <label className="flex flex-col gap-2 text-xs text-[var(--color-muted)] sm:col-span-2 lg:col-span-1">
            Business type
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
        </div>

        {error && (
          <p role="alert" className="py-5 text-sm text-[var(--color-danger)]">
            {error}
          </p>
        )}

        {!loading && businesses.length === 0 && !error && (
          <div className="border-b border-[var(--color-border)] py-12">
            <h3 className="font-display text-xl font-semibold">
              No matches just yet.
            </h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Try another material or broaden your filters.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 text-sm underline decoration-[var(--color-accent)] decoration-2 underline-offset-4"
            >
              Show all businesses
            </button>
          </div>
        )}

        <div
          aria-busy={loading}
          className="grid grid-cols-1 gap-x-5 gap-y-0 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-8"
        >
          {businesses.map((business, index) => (
            <BusinessCard
              key={business.id}
              business={business}
              index={index}
            />
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
    </>
  );
}
