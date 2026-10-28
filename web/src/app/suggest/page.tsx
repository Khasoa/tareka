"use client";

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import Link from "next/link";

import BackToDirectory from "@/components/BackToDirectory";
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

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint ? (
        <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export default function SuggestPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  function update(field: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function reset() {
    setForm(initialForm);
    setStatus("idle");
    setError("");
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

        <main className="page-shell py-16 sm:py-24">
          <div className="max-w-xl">
            <p className="kicker">Suggestion received</p>

            <h1 className="page-heading mt-3">Thank you.</h1>

            <p className="mt-4 leading-7 text-[var(--color-muted)]">
              We&apos;ll research the business before it&apos;s added. A
              suggestion doesn&apos;t create a public listing on its own.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/#directory" className="btn-primary">
                Back to directory
              </Link>

              <button type="button" onClick={reset} className="btn-secondary">
                Suggest another
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="page-shell py-12 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <aside className="lg:sticky lg:top-[calc(var(--site-header-h)+2rem)] lg:self-start">
            <BackToDirectory />

            <p className="kicker mt-10">Community contribution</p>

            <h1 className="page-heading mt-3">Suggest a business</h1>

            <p className="mt-4 max-w-sm leading-7 text-[var(--color-muted)]">
              Know a recycler, collector or upcycler we haven&apos;t listed?
            </p>

            <ol className="mt-10 flex flex-col gap-3 text-sm">
              <li className="flex gap-4">
                <span className="font-meta text-[var(--color-muted)]">01</span>
                You send it
              </li>
              <li className="flex gap-4">
                <span className="font-meta text-[var(--color-muted)]">02</span>
                We research it
              </li>
              <li className="flex gap-4">
                <span className="font-meta text-[var(--color-muted)]">03</span>
                If it checks out, it&apos;s listed
              </li>
            </ol>
          </aside>

          <form
            onSubmit={handleSubmit}
            className="relative flex max-w-xl flex-col gap-6"
          >
            <div aria-hidden="true" className="absolute -left-[9999px]">
              <label htmlFor="suggestion-website">
                Leave this field blank
              </label>

              <input
                id="suggestion-website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={form.honeypot}
                onChange={(event) => update("honeypot", event.target.value)}
              />
            </div>

            <Field id="name" label="Business name">
              <input
                id="name"
                type="text"
                required
                maxLength={200}
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                className="input-field"
              />
            </Field>

            <Field id="county" label="County">
              <input
                id="county"
                type="text"
                required
                maxLength={100}
                value={form.county}
                onChange={(event) => update("county", event.target.value)}
                className="input-field"
              />
            </Field>

            <Field
              id="source_url"
              label="Website or source"
              hint="A website, social page or directory listing that helps us verify it."
            >
              <input
                id="source_url"
                type="url"
                required
                maxLength={500}
                value={form.source_url}
                onChange={(event) => update("source_url", event.target.value)}
                placeholder="https://..."
                className="input-field"
              />
            </Field>

            <details className="suggest-more">
              <summary>Add more detail (optional)</summary>

              <div className="mt-6 flex flex-col gap-6">
                <Field id="description" label="What does it do?">
                  <textarea
                    id="description"
                    rows={3}
                    maxLength={2000}
                    value={form.description_raw}
                    onChange={(event) =>
                      update("description_raw", event.target.value)
                    }
                    placeholder="e.g. collects plastic waste, or turns organic waste into animal feed"
                    className="input-field resize-y"
                  />
                </Field>

                <Field id="materials" label="Materials handled">
                  <input
                    id="materials"
                    type="text"
                    maxLength={1000}
                    value={form.materials_raw}
                    onChange={(event) =>
                      update("materials_raw", event.target.value)
                    }
                    placeholder="e.g. PET bottles, cardboard, organic waste"
                    className="input-field"
                  />
                </Field>

                <Field id="phone" label="Phone number">
                  <input
                    id="phone"
                    type="tel"
                    maxLength={50}
                    value={form.phone}
                    onChange={(event) => update("phone", event.target.value)}
                    className="input-field"
                  />
                </Field>

                <Field
                  id="submitter_email"
                  label="Your email"
                  hint="Only if you'd like us to follow up."
                >
                  <input
                    id="submitter_email"
                    type="email"
                    maxLength={200}
                    value={form.submitter_email}
                    onChange={(event) =>
                      update("submitter_email", event.target.value)
                    }
                    className="input-field"
                  />
                </Field>

                <Field id="submitter_note" label="Anything else?">
                  <textarea
                    id="submitter_note"
                    rows={3}
                    maxLength={2000}
                    value={form.submitter_note}
                    onChange={(event) =>
                      update("submitter_note", event.target.value)
                    }
                    className="input-field resize-y"
                  />
                </Field>
              </div>
            </details>

            {status === "error" && (
              <p role="alert" className="alert-error">
                {error}
              </p>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={status === "sending"}
                className="btn-primary"
              >
                {status === "sending" ? "Sending…" : "Submit suggestion"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}