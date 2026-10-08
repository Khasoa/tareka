"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";

import Header from "@/components/Header";
import { createSuggestion } from "@/lib/api";

type FormState = {
  name: string;
  county: string;
  description_raw: string;
  materials_raw: string;
  source_url: string;
  phone: string;
  submitter_note: string;
  submitter_email: string;
  honeypot: string;
};

const initialForm: FormState = {
  name: "",
  county: "",
  description_raw: "",
  materials_raw: "",
  source_url: "",
  phone: "",
  submitter_note: "",
  submitter_email: "",
  honeypot: "",
};

export default function SuggestPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<
    "idle" | "sending" | "done" | "error"
  >("idle");
  const [error, setError] = useState("");

  function update(field: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setStatus("sending");
    setError("");

    try {
      await createSuggestion({
        name: form.name.trim(),
        county: form.county.trim(),
        description_raw: form.description_raw.trim() || null,
        materials_raw: form.materials_raw.trim() || null,
        source_url: form.source_url.trim(),
        phone: form.phone.trim() || null,
        submitter_note: form.submitter_note.trim() || null,
        submitter_email: form.submitter_email.trim() || null,
        honeypot: form.honeypot,
      });

      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  if (status === "done") {
    return (
      <>
        <Header />

        <main className="mx-auto w-full max-w-xl px-6 py-16 sm:py-20">
          <div className="rounded-2xl border border-black bg-white p-8 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent-text)]">
              Suggestion received
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Thank you.
            </h1>

            <p className="mt-4 leading-7 text-[var(--color-body)]">
              We&apos;ll research the business before it&apos;s added to the
              directory. A suggestion does not automatically create a public
              listing.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/directory"
                className="rounded-full border border-black bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-accent)] hover:text-[var(--color-heading)]"
              >
                Browse directory
              </Link>

              <Link
                href="/"
                className="rounded-full border border-black bg-white px-5 py-2.5 text-sm font-medium text-[var(--color-heading)] transition hover:bg-black hover:text-white"
              >
                Back home
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="mx-auto w-full max-w-2xl px-6 py-12 sm:py-16">
        <div className="border-b border-black pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent-text)]">
            Community contribution
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Suggest a business
          </h1>

          <p className="mt-4 max-w-xl leading-7 text-[var(--color-muted)]">
            Know a recycling, collection, or upcycling business that isn&apos;t
            listed yet? Tell us about it. We review every suggestion before
            publishing a listing.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-black bg-white p-6 sm:p-8"
        >
          <div
            aria-hidden="true"
            className="absolute -left-[9999px]"
          >
            <label htmlFor="suggestion-website">
              Leave this field blank
            </label>

            <input
              id="suggestion-website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={form.honeypot}
              onChange={(event) =>
                update("honeypot", event.target.value)
              }
            />
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium"
              >
                Business name
              </label>

              <input
                id="name"
                type="text"
                required
                maxLength={200}
                value={form.name}
                onChange={(event) =>
                  update("name", event.target.value)
                }
                className="w-full rounded-lg border border-black bg-white px-3 py-3 outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>

            <div>
              <label
                htmlFor="county"
                className="mb-2 block text-sm font-medium"
              >
                County
              </label>

              <input
                id="county"
                type="text"
                required
                maxLength={100}
                value={form.county}
                onChange={(event) =>
                  update("county", event.target.value)
                }
                className="w-full rounded-lg border border-black bg-white px-3 py-3 outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium"
              >
                What does the business do?
              </label>

              <textarea
                id="description"
                rows={4}
                maxLength={2000}
                value={form.description_raw}
                onChange={(event) =>
                  update("description_raw", event.target.value)
                }
                placeholder="For example, collects plastic waste or turns organic waste into animal feed."
                className="w-full resize-y rounded-lg border border-black bg-white px-3 py-3 outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>

            <div>
              <label
                htmlFor="materials"
                className="mb-2 block text-sm font-medium"
              >
                Materials handled
              </label>

              <input
                id="materials"
                type="text"
                maxLength={1000}
                value={form.materials_raw}
                onChange={(event) =>
                  update("materials_raw", event.target.value)
                }
                placeholder="e.g. PET bottles, cardboard, organic waste"
                className="w-full rounded-lg border border-black bg-white px-3 py-3 outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>

            <div>
              <label
                htmlFor="source_url"
                className="mb-2 block text-sm font-medium"
              >
                Website or source URL
              </label>

              <input
                id="source_url"
                type="url"
                required
                maxLength={500}
                value={form.source_url}
                onChange={(event) =>
                  update("source_url", event.target.value)
                }
                placeholder="https://..."
                className="w-full rounded-lg border border-black bg-white px-3 py-3 outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]"
              />

              <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">
                Use a website, social page, directory page, or another
                source that helps us verify the business.
              </p>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium"
              >
                Phone number
                <span className="ml-1 font-normal text-[var(--color-muted)]">
                  (optional)
                </span>
              </label>

              <input
                id="phone"
                type="tel"
                maxLength={50}
                value={form.phone}
                onChange={(event) =>
                  update("phone", event.target.value)
                }
                className="w-full rounded-lg border border-black bg-white px-3 py-3 outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>

            <div>
              <label
                htmlFor="submitter_email"
                className="mb-2 block text-sm font-medium"
              >
                Your email
                <span className="ml-1 font-normal text-[var(--color-muted)]">
                  (optional)
                </span>
              </label>

              <input
                id="submitter_email"
                type="email"
                maxLength={200}
                value={form.submitter_email}
                onChange={(event) =>
                  update("submitter_email", event.target.value)
                }
                className="w-full rounded-lg border border-black bg-white px-3 py-3 outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]"
              />

              <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">
                Leave your email if you&apos;d like us to contact you
                about the submission.
              </p>
            </div>

            <div>
              <label
                htmlFor="submitter_note"
                className="mb-2 block text-sm font-medium"
              >
                Anything else we should know?
                <span className="ml-1 font-normal text-[var(--color-muted)]">
                  (optional)
                </span>
              </label>

              <textarea
                id="submitter_note"
                rows={4}
                maxLength={2000}
                value={form.submitter_note}
                onChange={(event) =>
                  update("submitter_note", event.target.value)
                }
                className="w-full resize-y rounded-lg border border-black bg-white px-3 py-3 outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>
          </div>

          {status === "error" && (
            <p
              role="alert"
              className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {error}
            </p>
          )}

          <div className="mt-8 border-t border-[var(--color-border)] pt-6">
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-full border border-black bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent)] hover:text-[var(--color-heading)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "sending"
                ? "Sending…"
                : "Submit suggestion"}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}