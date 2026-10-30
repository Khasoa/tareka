"use client";

import { useEffect, useRef, useState } from "react";

const EMAIL = "hello@tareka.directory";

type CopyStatus = "idle" | "copied" | "failed";

type Props = {
  className?: string;
  showExternalIcon?: boolean;
};

function fallbackCopy(value: string) {
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.top = "0";
  field.style.left = "0";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.focus();
  field.select();
  field.setSelectionRange(0, value.length);
  const ok = document.execCommand("copy");
  document.body.removeChild(field);
  if (!ok) {
    throw new Error("Copy command was rejected");
  }
}

function writeClipboard(value: string) {
  if (!navigator.clipboard?.writeText) {
    return Promise.reject(new Error("Clipboard API unavailable"));
  }

  return Promise.race([
    navigator.clipboard.writeText(value),
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error("Clipboard timed out")), 1200);
    }),
  ]);
}

export default function ContactLink({
  className = "",
  showExternalIcon = false,
}: Props) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const resetTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
    };
  }, []);

  function scheduleReset() {
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => {
      setStatus("idle");
    }, 2000);
  }

  async function copyEmail() {
    try {
      await writeClipboard(EMAIL);
      setStatus("copied");
      scheduleReset();
    } catch {
      try {
        fallbackCopy(EMAIL);
        setStatus("copied");
        scheduleReset();
      } catch {
        setStatus("failed");
        scheduleReset();
      }
    }
  }

  const announcement =
    status === "copied"
      ? "Email address copied to clipboard"
      : status === "failed"
        ? `Could not copy. The email is ${EMAIL}`
        : "";

  return (
    <span className={`contact-copy ${className}`.trim()} data-copy-status={status}>
      <button
        type="button"
        onClick={() => {
          void copyEmail();
        }}
        aria-label={`Copy email address ${EMAIL}`}
        className="contact-link text-[var(--color-ink)] transition-colors hover:text-[var(--color-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ink)]"
      >
        <span className="contact-link__label">
          Contact
          {showExternalIcon ? (
            <>
              {" "}
              <span aria-hidden="true">↗</span>
            </>
          ) : null}
        </span>
        <span className="contact-link__email">{EMAIL}</span>
      </button>

      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>

      {status === "copied" ? (
        <span className="contact-copy__status" aria-hidden="true">
          Copied!
        </span>
      ) : null}

      {status === "failed" ? (
        <span className="contact-copy__status contact-copy__status--failed">
          Couldn&apos;t copy
        </span>
      ) : null}
    </span>
  );
}
