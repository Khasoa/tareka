"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  adminRequest,
  type AdminBusinessDetail,
  type VerificationAnswer,
  type VerifyBusinessPayload,
} from "@/lib/adminApi";
import {
  adminServiceAvailabilityLabel,
  businessTypeLabel,
  CANONICAL_BUSINESS_TYPES,
  formatBusinessTypesLine,
  formatLocation,
  verificationDisplay,
} from "@/lib/publicLabels";

type ServiceValue = "yes" | "no" | "unknown";

type ChecklistField = keyof Omit<VerifyBusinessPayload, "notes">;

const CHECKLIST_FIELDS: {
  key: ChecklistField;
  label: string;
}[] = [
  { key: "existence_confirmed", label: "Business exists and is operational" },
  { key: "identity_consistent", label: "Listing identity matches credible sources" },
  { key: "location_confirmed", label: "County and town are accurate" },
  { key: "materials_confirmed", label: "Materials handled are supported by evidence" },
  {
    key: "dropoff_policy_confirmed",
    label: "Public drop-off policy is accurate",
  },
];

const ANSWER_OPTIONS: { value: VerificationAnswer; label: string }[] = [
  { value: "confirmed", label: "Confirmed" },
  { value: "unknown", label: "Unknown / needs research" },
  { value: "not_confirmed", label: "Not confirmed" },
];

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all font-medium text-[var(--color-heading)] underline decoration-[var(--color-border-strong)] underline-offset-2 transition hover:text-[var(--color-ink)]"
    >
      {children}
    </a>
  );
}

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

export default function AdminVerificationDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const businessId = Number(params.id);
  const invalidId = !Number.isFinite(businessId);

  const [business, setBusiness] = useState<AdminBusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState("");
  const [checklist, setChecklist] = useState<
    Record<ChecklistField, VerificationAnswer>
  >({
    existence_confirmed: "unknown",
    identity_consistent: "unknown",
    location_confirmed: "unknown",
    materials_confirmed: "unknown",
    dropoff_policy_confirmed: "unknown",
  });
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [dropoffValue, setDropoffValue] = useState<ServiceValue>("unknown");
  const [pickupValue, setPickupValue] = useState<ServiceValue>("unknown");
  const [servicesBusy, setServicesBusy] = useState(false);
  const [typesBusy, setTypesBusy] = useState(false);

  const backHref = useMemo(
    () => `/admin/verification${queueQueryString(searchParams)}`,
    [searchParams],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await adminRequest<AdminBusinessDetail>(
          `/api/admin/businesses/${businessId}`,
        );
        if (!cancelled) {
          setBusiness(data);
          setSelectedTypes(data.business_types ?? []);
          setDropoffValue(
            (data.accepts_public_dropoff as ServiceValue) || "unknown",
          );
          setPickupValue((data.offers_pickup as ServiceValue) || "unknown");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load this business.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (invalidId) {
      return undefined;
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [businessId, invalidId]);

  async function saveServices() {
    if (!business) return;
    setServicesBusy(true);
    setError("");
    setMessage("");
    try {
      await adminRequest(`/api/admin/businesses/${business.id}/services`, {
        method: "PATCH",
        body: JSON.stringify({
          accepts_public_dropoff: dropoffValue,
          offers_pickup: pickupValue,
        }),
      });
      const refreshed = await adminRequest<AdminBusinessDetail>(
        `/api/admin/businesses/${business.id}`,
      );
      setBusiness(refreshed);
      setMessage("Service availability updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save services.");
    } finally {
      setServicesBusy(false);
    }
  }

  async function saveTypes() {
    if (!business) return;
    if (selectedTypes.length === 0) {
      setError("Select at least one business type.");
      return;
    }
    setTypesBusy(true);
    setError("");
    setMessage("");
    try {
      await adminRequest(`/api/admin/businesses/${business.id}/types`, {
        method: "PATCH",
        body: JSON.stringify({ business_types: selectedTypes }),
      });
      const refreshed = await adminRequest<AdminBusinessDetail>(
        `/api/admin/businesses/${business.id}`,
      );
      setBusiness(refreshed);
      setSelectedTypes(refreshed.business_types ?? []);
      setMessage("Business types updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save types.");
    } finally {
      setTypesBusy(false);
    }
  }

  async function submitDecision(intent: "verify" | "needs_review") {
    if (!business) return;

    if (!notes.trim()) {
      setError("Add brief review notes explaining your decision.");
      return;
    }

    const payload: VerifyBusinessPayload = {
      ...checklist,
      notes: notes.trim(),
    };

    if (intent === "verify") {
      const allConfirmed = CHECKLIST_FIELDS.every(
        (field) => checklist[field.key] === "confirmed",
      );
      if (!allConfirmed) {
        setError("Confirm every checklist item before verifying.");
        return;
      }

      const evidence = [
        business.source_url ? `Source: ${business.source_url}` : null,
        business.website_url ? `Website: ${business.website_url}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      if (
        !window.confirm(
          `Verify "${business.name}" for public directory visibility?\n\n${evidence || "No external URLs on file — confirm your research notes are sufficient."}`,
        )
      ) {
        return;
      }
    } else if (
      !window.confirm(
        `Mark "${business.name}" as needs review? It will stay out of the public directory.`,
      )
    ) {
      return;
    }

    if (intent === "needs_review") {
      const hasGap = CHECKLIST_FIELDS.some(
        (field) => checklist[field.key] !== "confirmed",
      );
      if (!hasGap) {
        setError(
          "Uncheck or mark at least one item as unknown or not confirmed for further review.",
        );
        return;
      }
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const result = await adminRequest<{ status: string }>(
        `/api/admin/businesses/${business.id}/verify`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      const refreshed = await adminRequest<AdminBusinessDetail>(
        `/api/admin/businesses/${business.id}`,
      );
      setBusiness(refreshed);
      setMessage(
        result.status === "verified"
          ? "Business verified. It is now eligible for the public directory."
          : "Marked for further review. The listing remains unpublished.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save decision.");
    } finally {
      setBusy(false);
    }
  }

  if (invalidId) {
    return (
      <AdminShell title="Business review" kicker="Verification">
        <p role="alert" className="mt-8 alert-error">Invalid business id.</p>
        <Link href={backHref} className="mt-6 inline-block text-sm font-semibold">
          ← Back to queue
        </Link>
      </AdminShell>
    );
  }

  if (loading) {
    return (
      <AdminShell title="Business review" kicker="Verification">
        <p className="mt-8 text-sm text-[var(--color-muted)]">Loading business…</p>
      </AdminShell>
    );
  }

  if (error && !business) {
    return (
      <AdminShell title="Business review" kicker="Verification">
        <p role="alert" className="mt-8 alert-error">{error}</p>
        <Link href={backHref} className="mt-6 inline-block text-sm font-semibold">
          ← Back to queue
        </Link>
      </AdminShell>
    );
  }

  if (!business) {
    return null;
  }

  const status = verificationDisplay(business.verification_status);
  const primaryLocation = business.locations[0];
  const materials =
    business.materials.length > 0
      ? business.materials.map((item) => item.name).join(", ")
      : "Not recorded";

  return (
    <AdminShell
      title={business.name}
      kicker="Verification review"
      description="Confirm evidence before publishing this listing to the public directory."
    >
      <Link
        href={backHref}
        className="mt-2 inline-block text-sm font-semibold text-[var(--color-heading)] transition hover:text-[var(--color-ink)]"
      >
        ← Back to verification queue
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {business.types_unresolved ? (
          <span className="rounded-[var(--radius-control)] border border-amber-600/40 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900">
            Types unresolved
          </span>
        ) : null}
        <span
          className={`rounded-[var(--radius-control)] border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            status.tone === "review"
              ? "border-amber-600/40 bg-amber-50 text-amber-900"
              : "border-[var(--color-border-strong)] bg-[var(--color-accent-soft)]"
          }`}
        >
          {status.label}
        </span>
        {business.last_verified_at && (
          <p className="text-sm text-[var(--color-muted)]">
            Last verified {new Date(business.last_verified_at).toLocaleDateString()}
          </p>
        )}
      </div>

      <section className="mt-8 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6">
        <h2 className="text-lg font-semibold">Listing data</h2>
        <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-[var(--color-heading)]">Types</dt>
            <dd className="mt-1">
              {formatBusinessTypesLine(business.business_types) ||
                (business.legacy_business_type === "mixed"
                  ? "Legacy mixed (assign types)"
                  : "Not recorded")}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--color-heading)]">Location</dt>
            <dd className="mt-1">
              {primaryLocation
                ? formatLocation(primaryLocation.town, primaryLocation.county)
                : "Not recorded"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--color-heading)]">Materials</dt>
            <dd className="mt-1">{materials}</dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--color-heading)]">
              Public drop-off
            </dt>
            <dd className="mt-1">
              {adminServiceAvailabilityLabel(business.accepts_public_dropoff)}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--color-heading)]">Pick-up</dt>
            <dd className="mt-1">
              {adminServiceAvailabilityLabel(business.offers_pickup)}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-semibold text-[var(--color-heading)]">
              Description
            </dt>
            <dd className="mt-1 whitespace-pre-wrap leading-6">
              {business.description?.trim() || "No description recorded."}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--color-heading)]">Website</dt>
            <dd className="mt-1">
              {business.website_url ? (
                <ExternalLink href={business.website_url}>
                  {business.website_url}
                </ExternalLink>
              ) : (
                "Not recorded"
              )}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--color-heading)]">
              Research source
            </dt>
            <dd className="mt-1">
              {business.source_url ? (
                <ExternalLink href={business.source_url}>
                  {business.source_url}
                </ExternalLink>
              ) : (
                "Not recorded"
              )}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--color-heading)]">Phone</dt>
            <dd className="mt-1">{business.phone?.trim() || "Not recorded"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--color-heading)]">Email</dt>
            <dd className="mt-1">{business.email?.trim() || "Not recorded"}</dd>
          </div>
        </dl>
      </section>

      {business.verification_records.length > 0 && (
        <section className="mt-6 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6">
          <h2 className="text-lg font-semibold">Verification history</h2>
          <ul className="mt-4 space-y-4 text-sm">
            {business.verification_records.map((record) => (
              <li
                key={record.id}
                className="border-b border-[var(--color-border)] pb-4 last:border-0 last:pb-0"
              >
                <p className="font-semibold text-[var(--color-heading)]">
                  {verificationDisplay(record.status).label}
                  {" · "}
                  {new Date(record.verified_at).toLocaleString()}
                </p>
                {record.notes && (
                  <p className="mt-1 whitespace-pre-wrap leading-6 text-[var(--color-body)]">
                    {record.notes}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6">
        <h2 className="text-lg font-semibold">Types and services</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          Updating types or service availability does not verify the business or
          refresh the last-checked date. Set each field independently from the
          other.
        </p>

        <fieldset className="mt-5">
          <legend className="text-sm font-semibold">Business types</legend>
          <div className="mt-3 flex flex-wrap gap-4">
            {CANONICAL_BUSINESS_TYPES.map((value) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(value)}
                  onChange={(event) => {
                    setSelectedTypes((current) =>
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
          <button
            type="button"
            disabled={typesBusy}
            onClick={() => void saveTypes()}
            className="btn-secondary mt-4 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {typesBusy ? "Saving…" : "Save types"}
          </button>
        </fieldset>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Public drop-off
            <select
              value={dropoffValue}
              onChange={(event) =>
                setDropoffValue(event.target.value as ServiceValue)
              }
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
              value={pickupValue}
              onChange={(event) =>
                setPickupValue(event.target.value as ServiceValue)
              }
              className="input-field mt-2 py-2.5"
            >
              <option value="unknown">Unknown</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
        </div>
        <button
          type="button"
          disabled={servicesBusy}
          onClick={() => void saveServices()}
          className="btn-secondary mt-4 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {servicesBusy ? "Saving…" : "Save services"}
        </button>
      </section>

      <section className="mt-6 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6">
        <h2 className="text-lg font-semibold">Verification checklist</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          Every item must be confirmed to verify. Mark gaps as unknown or not
          confirmed when more research is required.
        </p>

        <div className="mt-5 space-y-4">
          {CHECKLIST_FIELDS.map((field) => (
            <fieldset
              key={field.key}
              className="rounded-[var(--radius-control)] border border-[var(--color-border)] p-4"
            >
              <legend className="px-1 text-sm font-semibold">{field.label}</legend>
              <div className="mt-3 flex flex-wrap gap-4">
                {ANSWER_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name={field.key}
                      value={option.value}
                      checked={checklist[field.key] === option.value}
                      onChange={() =>
                        setChecklist((current) => ({
                          ...current,
                          [field.key]: option.value,
                        }))
                      }
                      className="h-4 w-4 accent-[var(--color-ink)]"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        <label className="mt-6 block text-sm font-semibold">
          Review notes
          <textarea
            required
            maxLength={1000}
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="input-field mt-2 py-2.5 leading-6"
            placeholder="Summarize the evidence you checked (website, source URL, contact details, etc.)."
          />
        </label>

        {error && (
          <p role="alert" className="mt-5 alert-error">
            {error}
          </p>
        )}

        {message && (
          <p role="status" className="notice mt-5 px-4 py-3 text-sm">
            {message}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3 border-t border-[var(--color-border)] pt-5">
          <button
            type="button"
            disabled={busy}
            onClick={() => submitDecision("verify")}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Saving…" : "Verify for public directory"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => submitDecision("needs_review")}
            className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Needs further research
          </button>
        </div>
      </section>
    </AdminShell>
  );
}
