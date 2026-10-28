"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { adminRequest, type AdminOverview } from "@/lib/adminApi";

type QueueCardProps = {
  href: string;
  kicker: string;
  title: string;
  description: string;
  count: number | null;
  countLabel: string;
};

function QueueCard({
  href,
  kicker,
  title,
  description,
  count,
  countLabel,
}: QueueCardProps) {
  return (
    <Link
      href={href}
      className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6 transition hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="kicker text-sm font-semibold tracking-wide">{kicker}</p>
          <h2 className="mt-3 text-xl font-semibold">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            {description}
          </p>
        </div>
        <div className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-paper)] px-3 py-2 text-center">
          <p className="text-2xl font-semibold">{count ?? "—"}</p>
          <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
            {countLabel}
          </p>
        </div>
      </div>
      <span className="mt-6 inline-block text-sm font-semibold">Open queue →</span>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [admin, stats] = await Promise.all([
          adminRequest<{ email: string }>("/api/admin/me"),
          adminRequest<AdminOverview>("/api/admin/overview"),
        ]);
        if (!cancelled) {
          setEmail(admin.email);
          setOverview(stats);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load admin workspace.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    try {
      await adminRequest("/api/admin/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign out.");
    }
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 sm:py-12">
        Loading admin…
      </main>
    );
  }

  return (
    <AdminShell
      title="Review workspace"
      description={
        email ? `Signed in as ${email}` : "Manage directory verification, suggestions, and claims."
      }
    >
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={logout}
          className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--color-ink)] hover:text-[var(--color-inverse)]"
        >
          Sign out
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-5 alert-error">
          {error}
        </p>
      )}

      <div className="mt-8 grid gap-6">
        <QueueCard
          href="/admin/verification"
          kicker="DIRECTORY RECORDS"
          title="Business verification"
          description="Review imported and editorial listings in the businesses table. Verify each record deliberately before it can appear publicly."
          count={overview?.pending_verification ?? null}
          countLabel="Awaiting review"
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <QueueCard
            href="/admin/suggestions"
            kicker="INCOMING"
            title="Business suggestions"
            description="Research public submissions and prepare canonical listings through the editorial workflow."
            count={overview?.new_suggestions ?? null}
            countLabel="New"
          />

          <QueueCard
            href="/admin/claims"
            kicker="EXISTING LISTINGS"
            title="Business claims"
            description="Review claimant details and consent. Approval does not automatically verify a listing."
            count={overview?.pending_claims ?? null}
            countLabel="Pending"
          />
        </div>
      </div>
    </AdminShell>
  );
}
