"use client";

import { useEffect, useState } from "react";

import BusinessCard from "@/components/BusinessCard";
import DirectoryFilters from "@/components/DirectoryFilters";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import { getBusinesses, getCounties, getMaterials, type Business } from "@/lib/api";

type MaterialOption = { id: number; name: string; slug: string; parent_id: number | null };
type Status = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready" };

export default function DirectoryPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  const [businessType, setBusinessType] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [county, setCounty] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [counties, setCounties] = useState<string[]>([]);
  const [materials, setMaterials] = useState<MaterialOption[]>([]);

  function withLoading<T>(setter: (value: T) => void) {
    return (value: T) => {
      setStatus({ kind: "loading" });
      setPage(1);
      setter(value);
    };
  }

  const handleBusinessTypeChange = withLoading(setBusinessType);
  const handleDropoffChange = withLoading(setDropoff);
  const handleCountyChange = withLoading(setCounty);
  const handleMaterialIdChange = withLoading(setMaterialId);

  useEffect(() => {
    getCounties().then(setCounties).catch(() => setCounties([]));
    getMaterials().then(setMaterials).catch(() => setMaterials([]));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), page_size: "15" });
    if (businessType) params.set("business_type", businessType);
    if (dropoff) params.set("accepts_public_dropoff", dropoff);
    if (county) params.set("county", county);
    if (materialId) params.set("material_id", materialId);

    getBusinesses(params)
      .then((data) => {
        setBusinesses(data.items);
        setTotal(data.total);
        setTotalPages(data.total_pages);
        setStatus({ kind: "ready" });
      })
      .catch(() => setStatus({ kind: "error", message: "We couldn't load the directory right now." }));
  }, [businessType, dropoff, county, materialId, page]);

  return (
    <>
      <Header />
      <Hero total={total} countiesCount={counties.length} />

      <main id="directory" className="mx-auto max-w-6xl px-6 pb-16">
        <DirectoryFilters
          businessType={businessType}
          dropoff={dropoff}
          county={county}
          materialId={materialId}
          counties={counties}
          materials={materials}
          onBusinessTypeChange={handleBusinessTypeChange}
          onDropoffChange={handleDropoffChange}
          onCountyChange={handleCountyChange}
          onMaterialIdChange={handleMaterialIdChange}
          onShowUpcyclers={() => handleBusinessTypeChange("upcycler")}
        />

        <div className="mt-8">
          {status.kind === "loading" && (
            <p className="text-[var(--color-muted)]">Finding recycling businesses...</p>
          )}
          {status.kind === "error" && <p className="text-[var(--color-muted)]">{status.message}</p>}
          {status.kind === "ready" && businesses.length === 0 && (
            <p className="text-[var(--color-muted)]">No businesses match these filters.</p>
          )}
          {status.kind === "ready" && businesses.length > 0 && (
            <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {businesses.map((business, i) => (
                <BusinessCard key={business.id} business={business} index={(page - 1) * 15 + i} />
              ))}
            </section>
          )}
        </div>

        {status.kind === "ready" && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-4 text-sm">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="disabled:opacity-30"
            >
              ← Previous
            </button>
            <span className="text-[var(--color-muted)]">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        )}
      </main>
    </>
  );
}