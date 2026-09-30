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
    <div>
      <div className="mb-4">
        <button
          type="button"
          onClick={onShowUpcyclers}
          className="rounded-full border px-4 py-2 text-sm font-medium"
        >
          ✨ Show me what&apos;s being made
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <label className="flex flex-col gap-2">
          <span className="font-medium">Business type</span>
          <select
            value={businessType}
            onChange={(event) => onBusinessTypeChange(event.target.value)}
            className="rounded border p-2"
          >
            <option value="">All</option>
            <option value="recycler">Recycler</option>
            <option value="upcycler">Upcycler</option>
            <option value="collector">Collector</option>
            <option value="mixed">Mixed</option>
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-medium">Public drop-off</span>
          <select
            value={dropoff}
            onChange={(event) => onDropoffChange(event.target.value)}
            className="rounded border p-2"
          >
            <option value="">All</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-medium">County</span>
          <select
            value={county}
            onChange={(event) => onCountyChange(event.target.value)}
            className="rounded border p-2"
          >
            <option value="">All counties</option>
            {counties.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-medium">Material</span>
          <select
            value={materialId}
            onChange={(event) => onMaterialIdChange(event.target.value)}
            className="rounded border p-2"
          >
            <option value="">All materials</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}