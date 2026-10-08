"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { adminRequest } from "@/lib/adminApi";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminRequest<{ email: string }>("/api/admin/me")
      .then((admin) => setEmail(admin.email))
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "Unable to load account.",
        );
      })
      .finally(() => setLoading(false));
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
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8 sm:py-12">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black pb-8">
        <div>
          <p className="text-sm font-semibold tracking-wide text-[var(--color-accent-text)]">
            tareka. / admin
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Review workspace
          </h1>

          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Signed in as {email || "admin"}
          </p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="rounded-lg border border-black bg-white px-4 py-2 text-sm font-medium transition hover:bg-black hover:text-white"
        >
          Sign out
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <Link
          href="/admin/suggestions"
          className="rounded-2xl border border-black bg-white p-6 transition hover:-translate-y-0.5"
        >
          <p className="text-sm font-semibold tracking-wide text-[var(--color-accent-text)]">
            INCOMING
          </p>

          <h2 className="mt-3 text-xl font-semibold">
            Business suggestions
          </h2>

          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Research submissions, prepare canonical listings, and publish or
            reject new suggestions.
          </p>

          <span className="mt-6 inline-block text-sm font-semibold">
            Review suggestions →
          </span>
        </Link>

        <Link
          href="/admin/claims"
          className="rounded-2xl border border-black bg-white p-6 transition hover:-translate-y-0.5"
        >
          <p className="text-sm font-semibold tracking-wide text-[var(--color-accent-text)]">
            EXISTING LISTINGS
          </p>

          <h2 className="mt-3 text-xl font-semibold">
            Business claims
          </h2>

          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Review claimant details and consent, approve or reject claims, and
            flag requested corrections for review.
          </p>

          <span className="mt-6 inline-block text-sm font-semibold">
            Review claims →
          </span>
        </Link>
      </div>
    </main>
  );
}