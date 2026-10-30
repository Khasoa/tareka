"use client";

import { useEffect, useState } from "react";
import {
  adminRequest,
  type MaterialOption,
  type Suggestion,
} from "@/lib/adminApi";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  CANONICAL_BUSINESS_TYPES,
  businessTypeLabel,
} from "@/lib/publicLabels";

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 220);
}

function SuggestionCard({
  suggestion,
  materials,
  onDone,
}: {
  suggestion: Suggestion;
  materials: MaterialOption[];
  onDone: () => Promise<void>;
}) {
  const [slug, setSlug] = useState(slugify(suggestion.name));
  const [businessTypes, setBusinessTypes] = useState<string[]>(["recycler"]);
  const [dropoff, setDropoff] = useState("unknown");
  const [pickup, setPickup] = useState("unknown");
  const [description, setDescription] = useState("");
  const [town, setTown] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState(suggestion.phone ?? "");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [materialIds, setMaterialIds] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function toggleMaterial(id: number, checked: boolean) {
    setMaterialIds((current) =>
      checked
        ? [...current, id]
        : current.filter((item) => item !== id),
    );
  }

  async function publish() {
    if (!description.trim()) {
      setError("Write a researched description before publishing.");
      return;
    }

    if (businessTypes.length === 0) {
      setError("Select at least one business type.");
      return;
    }

    if (!slug.trim()) {
      setError("Enter a URL slug.");
      return;
    }

    if (imageUrl.trim() && !imageAlt.trim()) {
      setError("Add a short image description, or leave the image URL empty.");
      return;
    }

    if (
      !window.confirm(
        `Publish "${suggestion.name}"? It stays unpublished until you mark it verified.`,
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await adminRequest(
        `/api/admin/suggestions/${suggestion.id}/publish`,
        {
          method: "POST",
          body: JSON.stringify({
            slug: slug.trim(),
            business_types: businessTypes,
            accepts_public_dropoff: dropoff,
            offers_pickup: pickup,
            description: description.trim(),
            town: town.trim() || null,
            website_url: website.trim() || null,
            phone: phone.trim() || null,
            image_url: imageUrl.trim() || null,
            image_alt: imageAlt.trim() || null,
            material_ids: materialIds,
          }),
        },
      );

      setMessage("Published.");
      await onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to publish.");
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!window.confirm(`Reject the suggestion for "${suggestion.name}"?`)) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await adminRequest(
        `/api/admin/suggestions/${suggestion.id}/reject`,
        {
          method: "POST",
        },
      );

      await onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reject.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)]">
      <div className="border-b border-[var(--color-border-strong)] bg-[var(--color-accent-soft)] px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="kicker">
              Business suggestion
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              {suggestion.name}
            </h2>

            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {suggestion.county}
              {suggestion.created_at
                ? ` · Submitted ${new Date(
                    suggestion.created_at,
                  ).toLocaleDateString()}`
                : ""}
            </p>
          </div>

          <span className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            {suggestion.status}
          </span>
        </div>
      </div>

      <div className="px-6 py-6">
        <dl className="grid gap-5 text-sm">
          {suggestion.description_raw && (
            <div>
              <dt className="font-semibold text-[var(--color-heading)]">
                Submitter’s description
              </dt>

              <dd className="mt-1 whitespace-pre-wrap leading-6 text-[var(--color-body)]">
                {suggestion.description_raw}
              </dd>
            </div>
          )}

          {suggestion.materials_raw && (
            <div>
              <dt className="font-semibold text-[var(--color-heading)]">
                Materials reported
              </dt>

              <dd className="mt-1 text-[var(--color-body)]">
                {suggestion.materials_raw}
              </dd>
            </div>
          )}

          {suggestion.submitter_note && (
            <div>
              <dt className="font-semibold text-[var(--color-heading)]">
                Submitter’s note
              </dt>

              <dd className="mt-1 whitespace-pre-wrap leading-6 text-[var(--color-body)]">
                {suggestion.submitter_note}
              </dd>
            </div>
          )}

          <div>
            <dt className="font-semibold text-[var(--color-heading)]">
              Research source
            </dt>

            <dd className="mt-1 break-all text-[var(--color-body)]">
              {suggestion.source_url}
            </dd>
          </div>

          {suggestion.submitter_email && (
            <div>
              <dt className="font-semibold text-[var(--color-heading)]">
                Submitter email
              </dt>

              <dd className="mt-1 text-[var(--color-body)]">
                {suggestion.submitter_email}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-8 border-t border-[var(--color-border-strong)] pt-6">
          <div>
            <p className="kicker">
              Editorial review
            </p>

            <h3 className="mt-2 text-xl font-semibold">
              Prepare canonical listing
            </h3>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
              Verify the source and write an accurate description before
              publishing. The submitted description is not automatically
              trusted.
            </p>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              URL slug

              <input
                required
                maxLength={220}
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                className="input-field mt-2 py-2.5"
              />
            </label>

            <fieldset className="text-sm font-semibold sm:col-span-2">
              <legend>Business types</legend>
              <p className="mt-1 text-xs font-normal leading-5 text-[var(--color-muted)]">
                Assign only types supported by evidence. A business may have
                more than one.
              </p>
              <div className="mt-3 flex flex-wrap gap-4">
                {CANONICAL_BUSINESS_TYPES.map((value) => (
                  <label key={value} className="flex items-center gap-2 font-normal">
                    <input
                      type="checkbox"
                      checked={businessTypes.includes(value)}
                      onChange={(event) => {
                        setBusinessTypes((current) =>
                          event.target.checked
                            ? [...current, value]
                            : current.filter((item) => item !== value),
                        );
                      }}
                      className="h-4 w-4 accent-[var(--color-ink)]"
                    />
                    {businessTypeLabel(value)}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="text-sm font-semibold">
              Public drop-off

              <select
                value={dropoff}
                onChange={(event) => setDropoff(event.target.value)}
                className="input-field mt-2 py-2.5"
              >
                <option value="unknown">Unknown</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>

            <label className="text-sm font-semibold">
              Pick-up

              <select
                value={pickup}
                onChange={(event) => setPickup(event.target.value)}
                className="input-field mt-2 py-2.5"
              >
                <option value="unknown">Unknown</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>

            <label className="text-sm font-semibold">
              Town (optional)

              <input
                maxLength={100}
                value={town}
                onChange={(event) => setTown(event.target.value)}
                className="input-field mt-2 py-2.5"
              />
            </label>

            <label className="text-sm font-semibold sm:col-span-2">
              Researched description

              <textarea
                required
                maxLength={5000}
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="input-field mt-2 py-2.5 leading-6"
                placeholder="Describe what the business does, based on your research."
              />
            </label>

            <label className="text-sm font-semibold">
              Website (optional)

              <input
                type="url"
                maxLength={500}
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                className="input-field mt-2 py-2.5"
                placeholder="https://example.org"
              />
            </label>

            <label className="text-sm font-semibold">
              Phone (optional)

              <input
                maxLength={50}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="input-field mt-2 py-2.5"
              />
            </label>

            <label className="text-sm font-semibold">
              Image URL (optional)

              <input
                type="url"
                maxLength={500}
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                className="input-field mt-2 py-2.5"
                placeholder="https://example.org/photo.jpg"
              />
            </label>

            <label className="text-sm font-semibold">
              Image description

              <input
                maxLength={200}
                value={imageAlt}
                onChange={(event) => setImageAlt(event.target.value)}
                className="input-field mt-2 py-2.5"
                placeholder="Required if an image URL is set"
              />
            </label>
          </div>

          <fieldset className="mt-6 border-t border-[var(--color-border)] pt-5">
            <legend className="text-sm font-semibold">
              Accepted materials
            </legend>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {materials.map((material) => (
                <label
                  key={material.id}
                  className="flex items-center gap-3 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-paper)] px-3 py-2.5 text-sm transition hover:border-[var(--color-border-strong)]"
                >
                  <input
                    type="checkbox"
                    checked={materialIds.includes(material.id)}
                    onChange={(event) =>
                      toggleMaterial(material.id, event.target.checked)
                    }
                    className="h-4 w-4 accent-[var(--color-ink)]"
                  />

                  {material.name}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-5 alert-error"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="notice mt-5 px-4 py-3 text-sm text-[var(--color-body)]"
          >
            {message}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={publish}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Processing…" : "Publish verified listing"}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={reject}
            className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reject suggestion
          </button>
        </div>
      </div>
    </article>
  );
}

export default function AdminSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setError("");

    try {
      const [suggestionData, materialData] = await Promise.all([
        adminRequest<Suggestion[]>("/api/admin/suggestions"),
        adminRequest<MaterialOption[]>("/directory/materials"),
      ]);

      setSuggestions(
        suggestionData.filter((item) => item.status === "new"),
      );

      setMaterials(materialData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load suggestions.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setError("");
      try {
        const [suggestionData, materialData] = await Promise.all([
          adminRequest<Suggestion[]>("/api/admin/suggestions"),
          adminRequest<MaterialOption[]>("/directory/materials"),
        ]);
        
        if (!cancelled) {
          setSuggestions(
            suggestionData.filter((item) => item.status === "new"),
          );
          setMaterials(materialData);
        }
      } catch (err) {
        if (!cancelled) setError(
          err instanceof Error
            ? err.message
            : "Unable to load suggestions.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminShell
      title="Business suggestions"
      kicker="Incoming"
      description="Review each source, research the business, and prepare the canonical listing before publication."
    >
      <div className="mt-2 flex justify-end">
        <div className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-center">
          <p className="text-2xl font-semibold">{suggestions.length}</p>
          <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
            Pending
          </p>
        </div>
      </div>

      {loading && (
        <p className="mt-8 text-sm text-[var(--color-muted)]">
          Loading suggestions…
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mt-6 alert-error"
        >
          {error}
        </p>
      )}

      {!loading && !error && suggestions.length === 0 && (
        <p className="mt-8 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-[var(--color-muted)]">
          No new suggestions to review.
        </p>
      )}

      <div className="mt-8 space-y-7">
        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            materials={materials}
            onDone={load}
          />
        ))}
      </div>
    </AdminShell>
  );
}