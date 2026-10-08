"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";

import { createClaim } from "@/lib/api";

type ClaimFormProps = {
  businessId: number;
};

type FormState = {
  claimant_name: string;
  claimant_role: string;
  claimant_contact: string;
  correction_note: string;
  content_use_consent: boolean;
  image_consent: boolean;
  honeypot: string;
};

const initialForm: FormState = {
  claimant_name: "",
  claimant_role: "",
  claimant_contact: "",
  correction_note: "",
  content_use_consent: false,
  image_consent: false,
  honeypot: "",
};

export default function ClaimForm({ businessId }: ClaimFormProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<
    "idle" | "sending" | "done" | "error"
  >("idle");
  const [error, setError] = useState("");

  function update(
    field: keyof FormState,
    value: string | boolean,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.content_use_consent) {
      setStatus("error");
      setError(
        "Please confirm that tareka. may use the information you provide for reviewing and managing this claim.",
      );
      return;
    }

    setStatus("sending");
    setError("");

    try {
      await createClaim(businessId, {
        claimant_name: form.claimant_name.trim(),
        claimant_role: form.claimant_role.trim(),
        claimant_contact: form.claimant_contact.trim(),
        correction_note: form.correction_note.trim() || null,
        content_use_consent: form.content_use_consent,
        image_consent: form.image_consent,
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
      <div className="mt-8 rounded-2xl border border-black bg-white p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent-text)]">
          Claim received
        </p>

        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          Thank you.
        </h2>

        <p className="mt-4 leading-7 text-[var(--color-body)]">
          Your claim has been submitted for review. Approval does not
          automatically change the listing; any requested corrections
          will be reviewed separately.
        </p>

        <Link
          href="/directory"
          className="mt-7 inline-flex rounded-full border border-black bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-accent)] hover:text-[var(--color-heading)]"
        >
          Back to directory
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 rounded-2xl border border-black bg-white p-6 sm:p-8"
    >
      <div
        aria-hidden="true"
        className="absolute -left-[9999px]"
      >
        <label htmlFor="claim-website">
          Leave this field blank
        </label>

        <input
          id="claim-website"
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
            htmlFor="claimant_name"
            className="mb-2 block text-sm font-medium"
          >
            Your name
          </label>

          <input
            id="claimant_name"
            type="text"
            required
            maxLength={200}
            value={form.claimant_name}
            onChange={(event) =>
              update("claimant_name", event.target.value)
            }
            className="w-full rounded-lg border border-black bg-white px-3 py-3 outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>

        <div>
          <label
            htmlFor="claimant_role"
            className="mb-2 block text-sm font-medium"
          >
            Your role in the business
          </label>

          <input
            id="claimant_role"
            type="text"
            required
            maxLength={50}
            value={form.claimant_role}
            onChange={(event) =>
              update("claimant_role", event.target.value)
            }
            placeholder="e.g. Owner, Manager, Director"
            className="w-full rounded-lg border border-black bg-white px-3 py-3 outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>

        <div>
          <label
            htmlFor="claimant_contact"
            className="mb-2 block text-sm font-medium"
          >
            Contact information
          </label>

          <textarea
            id="claimant_contact"
            required
            rows={3}
            maxLength={500}
            value={form.claimant_contact}
            onChange={(event) =>
              update("claimant_contact", event.target.value)
            }
            placeholder="Email address, phone number, or another way we can verify the claim."
            className="w-full resize-y rounded-lg border border-black bg-white px-3 py-3 outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>

        <div>
          <label
            htmlFor="correction_note"
            className="mb-2 block text-sm font-medium"
          >
            What would you like corrected?
            <span className="ml-1 font-normal text-[var(--color-muted)]">
              (optional)
            </span>
          </label>

          <textarea
            id="correction_note"
            rows={5}
            maxLength={2000}
            value={form.correction_note}
            onChange={(event) =>
              update("correction_note", event.target.value)
            }
            placeholder="Tell us about any information that is incorrect or missing."
            className="w-full resize-y rounded-lg border border-black bg-white px-3 py-3 outline-none transition focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>

        <div className="space-y-4 border-t border-[var(--color-border)] pt-6">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={form.content_use_consent}
              onChange={(event) =>
                update(
                  "content_use_consent",
                  event.target.checked,
                )
              }
              className="mt-1 size-4 accent-black"
            />

            <span className="text-sm leading-6">
              I confirm that I am submitting this information for
              review and give tareka. permission to use the information
              I provide for managing this claim and the listing.
            </span>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={form.image_consent}
              onChange={(event) =>
                update("image_consent", event.target.checked)
              }
              className="mt-1 size-4 accent-black"
            />

            <span className="text-sm leading-6">
              I give tareka. permission to use images I provide in
              connection with this listing.
              <span className="ml-1 text-[var(--color-muted)]">
                (optional)
              </span>
            </span>
          </label>
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
            ? "Submitting…"
            : "Submit claim"}
        </button>
      </div>
    </form>
  );
}