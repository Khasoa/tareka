"use client";

import { useEffect, useState } from "react";

import BusinessCard from "@/components/BusinessCard";
import DirectoryFilters from "@/components/DirectoryFilters";
import { getBusinesses, getCounties, getMaterials, type Business } from "@/lib/api";

type MaterialOption = { id: number; name: string; slug: string; parent_id: number | null };

type Status =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready" };

export default function DirectoryPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  const [businessType, setBusinessType] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [county, setCounty] = useState("");
  const [materialId, setMaterialId] = useState("");

  const [counties, setCounties] = useState<string[]>([]);
  const [materials, setMaterials] = useState<MaterialOption[]>([]);

  // Wraps a filter setter so the loading state is set synchronously in the
  // event handler that actually changed something — not inside an effect.
  function withLoading<T>(setter: (value: T) => void) {
    return (value: T) => {
      setStatus({ kind: "loading" });
      setter(value);
    };
  }

  const handleBusinessTypeChange = withLoading(setBusinessType);
  const handleDropoffChange = withLoading(setDropoff);
  const handleCountyChange = withLoading(setCounty);
  const handleMaterialIdChange = withLoading(setMaterialId);

  // Reference data — fetched once, not hardcoded in the frontend.
  useEffect(() => {
    getCounties().then(setCounties).catch(() => setCounties([]));
    getMaterials().then(setMaterials).catch(() => setMaterials([]));
  }, []);

  // Businesses — refetched whenever any filter changes. No synchronous
  // setState here; status transitions only happen after the fetch settles.
  useEffect(() => {
    const params = new URLSearchParams({ page: "1", page_size: "20" });
    if (businessType) params.set("business_type", businessType);
    if (dropoff) params.set("accepts_public_dropoff", dropoff);
    if (county) params.set("county", county);
    if (materialId) params.set("material_id", materialId);

    getBusinesses(params)
      .then((data) => {
        setBusinesses(data.items);
        setStatus({ kind: "ready" });
      })
      .catch(() =>
        setStatus({ kind: "error", message: "We couldn't load the directory right now." })
      );
  }, [businessType, dropoff, county, materialId]);

  return (
    <main className="min-h-screen p-10">
      <h1 className="text-4xl font-bold">Recycling Directory</h1>
      <p className="mt-4">Find recycling and waste-management businesses across Kenya.</p>

      <div className="mt-8">
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
      </div>

      {status.kind === "loading" && <p className="mt-8">Finding recycling businesses...</p>}

      {status.kind === "error" && <p className="mt-8">{status.message}</p>}

      {status.kind === "ready" && businesses.length === 0 && (
        <p className="mt-8">No businesses match these filters.</p>
      )}

      {status.kind === "ready" && businesses.length > 0 && (
        <section className="mt-8 grid gap-6 md:grid-cols-2">
          {businesses.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </section>
      )}
    </main>
  );
}