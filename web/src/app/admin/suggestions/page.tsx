"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  adminRequest,
  type MaterialOption,
  type Suggestion,
} from "@/lib/adminApi";

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
  const [businessType, setBusinessType] = useState("recycler");
  const [dropoff, setDropoff] = useState("unknown");
  const [description, setDescription] = useState("");
  const [town, setTown] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState(suggestion.phone ?? "");
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

    if (!slug.trim()) {
      setError("Enter a URL slug.");
      return;
    }

    if (!window.confirm(`Publish "${suggestion.name}" as a verified listing?`)) {
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
            business_type: businessType,
            accepts_public_dropoff: dropoff,
            description: description.trim(),
            town: town.trim() || null,
            website_url: website.trim() || null,
            phone: phone.trim() || null,
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
    <article className="overflow-hidden rounded-2xl border border-black bg-white">
      <div className="border-b border-black bg-[var(--color-accent-soft)] px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-accent-text)]">
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

          <span className="rounded-full border border-black bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide">
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

        <div className="mt-8 border-t border-black pt-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-accent-text)]">
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
                className="mt-2 w-full rounded-lg border border-black bg-white px-3 py-2.5 font-normal outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </label>

            <label className="text-sm font-semibold">
              Business type

              <select
                value={businessType}
                onChange={(event) => setBusinessType(event.target.value)}
                className="mt-2 w-full rounded-lg border border-black bg-white px-3 py-2.5 font-normal outline-none"
              >
                <option value="recycler">Recycler</option>
                <option value="upcycler">Upcycler</option>
                <option value="collector">Collector</option>
                <option value="mixed">Mixed</option>
              </select>
            </label>

            <label className="text-sm font-semibold">
              Public drop-off

              <select
                value={dropoff}
                onChange={(event) => setDropoff(event.target.value)}
                className="mt-2 w-full rounded-lg border border-black bg-white px-3 py-2.5 font-normal outline-none"
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
                className="mt-2 w-full rounded-lg border border-black bg-white px-3 py-2.5 font-normal outline-none"
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
                className="mt-2 w-full rounded-lg border border-black bg-white px-3 py-2.5 font-normal leading-6 outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]"
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
                className="mt-2 w-full rounded-lg border border-black bg-white px-3 py-2.5 font-normal outline-none"
                placeholder="https://example.org"
              />
            </label>

            <label className="text-sm font-semibold">
              Phone (optional)

              <input
                maxLength={50}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-2 w-full rounded-lg border border-black bg-white px-3 py-2.5 font-normal outline-none"
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
                  className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] px-3 py-2.5 text-sm transition hover:border-black"
                >
                  <input
                    type="checkbox"
                    checked={materialIds.includes(material.id)}
                    onChange={(event) =>
                      toggleMaterial(material.id, event.target.checked)
                    }
                    className="h-4 w-4 accent-black"
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
            className="mt-5 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="mt-5 rounded-lg border border-black bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-accent-text)]"
          >
            {message}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={publish}
            className="rounded-lg border border-black bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-accent)] hover:text-[var(--color-heading)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Processing…" : "Publish verified listing"}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={reject}
            className="rounded-lg border border-black bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-heading)] transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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
    <main className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
      <Link
        href="/admin"
        className="text-sm font-semibold text-[var(--color-heading)] transition hover:text-[var(--color-accent-text)]"
      >
        ← Admin workspace
      </Link>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-5 border-b border-black pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent-text)]">
            Incoming
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Business suggestions
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Review each source, research the business, and prepare the
            canonical listing before publication.
          </p>
        </div>

        <div className="rounded-xl border border-black bg-white px-4 py-3 text-center">
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
          className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}

      {!loading && !error && suggestions.length === 0 && (
        <p className="mt-8 rounded-2xl border border-black bg-white p-8 text-[var(--color-muted)]">
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
    </main>
  );
}