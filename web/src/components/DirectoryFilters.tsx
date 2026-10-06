"use client";

type MaterialOption = { id: number; name: string; slug: string; parent_id: number | null };

type DirectoryFiltersProps = {
  businessType: string;
  dropoff: string;
  county: string;
  materialId: string;
  counties: string[];
  materials: MaterialOption[];
  onBusinessTypeChange: (value: string) => void;
  onDropoffChange: (value: string) => void;
  onCountyChange: (value: string) => void;
  onMaterialIdChange: (value: string) => void;
  onShowUpcyclers: () => void;
};

const BUSINESS_TYPES = [
  { value: "", label: "All" },
  { value: "recycler", label: "Recycler" },
  { value: "upcycler", label: "Upcycler" },
  { value: "collector", label: "Collector" },
  { value: "mixed", label: "Mixed" },
];

const selectClassName =
  "w-full rounded-lg border border-[var(--color-border)] bg-white p-2 text-sm text-[var(--color-ink)] outline-none transition-colors hover:border-[var(--color-accent-text)] focus:border-[var(--color-accent-text)] focus:ring-2 focus:ring-[var(--color-accent-soft)] focus-visible:outline-none";

export default function DirectoryFilters({
  businessType,
  dropoff,
  county,
  materialId,
  counties,
  materials,
  onBusinessTypeChange,
  onDropoffChange,
  onCountyChange,
  onMaterialIdChange,
  onShowUpcyclers,
}: DirectoryFiltersProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-[var(--color-muted)]">
          Browse by
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {BUSINESS_TYPES.map((t) => {
              const selected = businessType === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => onBusinessTypeChange(t.value)}
                  aria-pressed={selected}
                  className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                    selected
                      ? "border-[var(--color-ink)] bg-[var(--color-ink)] font-medium text-white"
                      : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-accent-text)] hover:text-[var(--color-ink)]"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onShowUpcyclers}
            aria-pressed={businessType === "upcycler"}
            className={`ml-auto rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              businessType === "upcycler"
                ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                : "border-[var(--color-border-strong)] text-[var(--color-ink)] hover:bg-[var(--color-accent-soft)]"
            }`}
          >
            Show me what&apos;s being made
          </button>
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-[var(--color-muted)]">
          Refine
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <select
            value={dropoff}
            onChange={(event) => onDropoffChange(event.target.value)}
            className={selectClassName}
          >
            <option value="">Public drop-off: All</option>
            <option value="yes">Accepts drop-off</option>
            <option value="no">No public drop-off</option>
            <option value="unknown">Unknown</option>
          </select>

          <select
            value={county}
            onChange={(event) => onCountyChange(event.target.value)}
            className={selectClassName}
          >
            <option value="">All counties</option>
            {counties.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={materialId}
            onChange={(event) => onMaterialIdChange(event.target.value)}
            className={selectClassName}
          >
            <option value="">All materials</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}