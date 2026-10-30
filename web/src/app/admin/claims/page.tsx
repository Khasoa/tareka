"use client";

import { useEffect, useState } from "react";
import { adminRequest, type Claim } from "@/lib/adminApi";
import { AdminShell } from "@/components/admin/AdminShell";

function formatSubmittedAt(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Nairobi",
  }).format(new Date(value));
}

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const data = await adminRequest<Claim[]>("/api/admin/claims");
      setClaims(data.filter((claim) => claim.status === "pending"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load claims.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setError("");
      try {
        const data = await adminRequest<Claim[]>("/api/admin/claims");
        if (!cancelled) setClaims(data.filter((c) => c.status === "pending"));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load claims.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => { cancelled = true; };
  }, []);

  async function reviewClaim(claim: Claim, action: "approve" | "reject") {
    const verb = action === "approve" ? "Approve" : "Reject";
    if (!window.confirm(`${verb} the claim for "${claim.business_name}"?`)) return;

    setError("");
    try {
      await adminRequest(`/api/admin/claims/${claim.id}/${action}`, { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to review claim.");
    }
  }

  return (
    <AdminShell
      title="Business claims"
      kicker="Existing listings"
      description="Review claimant details and consent. Approval records the decision but does not automatically change the listing."
    >
      <div className="mt-2 flex justify-end">
        <div className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-center">
          <p className="text-2xl font-semibold">{claims.length}</p>
          <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Pending</p>
        </div>
      </div>

      {loading && <p className="mt-8 text-sm text-[var(--color-muted)]">Loading claims…</p>}
      {error && (
        <p role="alert" className="mt-6 alert-error">
          {error}
        </p>
      )}
      {!loading && !error && claims.length === 0 && (
        <p className="mt-8 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-[var(--color-muted)]">
          No pending claims.
        </p>
      )}

      <div className="mt-8 space-y-6">
        {claims.map((claim) => (
          <article key={claim.id} className="overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)]">
            <div className="border-b border-[var(--color-border-strong)] bg-[var(--color-accent-soft)] px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="kicker">
                    Listing claim
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">{claim.business_name}</h2>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    Claimant: {claim.claimant_name} · {claim.claimant_role}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    Submitted {formatSubmittedAt(claim.submitted_at)}
                  </p>
                </div>
                <span className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                  Pending
                </span>
              </div>
            </div>

            <div className="px-6 py-6">
              <dl className="grid gap-5 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-[var(--color-heading)]">Business listing</dt>
                  <dd className="mt-1 break-all text-[var(--color-body)]">{claim.business_slug}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--color-heading)]">Claimant contact</dt>
                  <dd className="mt-1 break-words text-[var(--color-body)]">{claim.claimant_contact}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--color-heading)]">Content-use consent</dt>
                  <dd className="mt-1 text-[var(--color-body)]">{claim.content_use_consent ? "Granted" : "Not granted"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--color-heading)]">Image consent</dt>
                  <dd className="mt-1 text-[var(--color-body)]">{claim.image_consent ? "Granted" : "Not granted"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-semibold text-[var(--color-heading)]">Requested corrections</dt>
                  <dd className="mt-1 whitespace-pre-wrap leading-6 text-[var(--color-body)]">
                    {claim.correction_note?.trim() || "No corrections submitted."}
                  </dd>
                </div>
              </dl>

              {claim.correction_note?.trim() && (
                <div className="mt-6 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-accent-soft)] p-4">
                  <p className="text-sm font-semibold text-[var(--color-heading)]">
                    Correction request requires separate review
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-body)]">
                    Approval flags the listing for review. An administrator must make any verified
                    changes separately.
                  </p>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3 border-t border-[var(--color-border)] pt-5">
                <button
                  type="button"
                  onClick={() => reviewClaim(claim, "approve")}
                  className="btn-primary"
                >
                  Approve claim
                </button>
                <button
                  type="button"
                  onClick={() => reviewClaim(claim, "reject")}
                  className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--color-heading)] transition hover:bg-[var(--color-ink)] hover:text-[var(--color-inverse)]"
                >
                  Reject claim
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}