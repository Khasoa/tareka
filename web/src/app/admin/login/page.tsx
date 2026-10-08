"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

import { adminRequest } from "@/lib/adminApi";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await adminRequest<{ status: string }>("/api/admin/login", {
        method: "POST",
        redirectOnUnauthorized: false,
        body: JSON.stringify({ email, password }),
      });

      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-5 py-12 sm:px-6 sm:py-16">
      <div className="rounded-2xl border border-black bg-white p-8 sm:p-10">
        <p className="text-sm font-semibold tracking-wide text-[var(--color-accent-text)]">
          tareka. / admin
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Sign in
        </h1>

        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          Access the internal listing review tools.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              maxLength={200}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-black bg-white px-3 py-3 outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-black bg-white px-3 py-3 outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg border border-black bg-black px-4 py-3 font-medium text-white transition hover:bg-[var(--color-accent)] hover:text-[var(--color-heading)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}