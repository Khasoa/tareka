"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { SITE_CONTACT_EMAIL } from "@/lib/siteConfig";

const EMAIL = SITE_CONTACT_EMAIL;

function subscribeCoarsePointer(onStoreChange: () => void) {
  const media = window.matchMedia("(hover: none)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getCoarsePointerSnapshot() {
  return window.matchMedia("(hover: none)").matches;
}

function getCoarsePointerServerSnapshot() {
  return true;
}

type CopyStatus = "idle" | "copied" | "failed";

type Props = {
  className?: string;
  showExternalIcon?: boolean;
  footerTouch?: boolean;
  /** Header menu: keep "Contact" label on touch; tap to copy/reveal. */
  menuLink?: boolean;
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
  footerTouch = false,
  menuLink = false,
}: Props) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const [revealed, setRevealed] = useState(false);
  const coarsePointer = useSyncExternalStore(
    subscribeCoarsePointer,
    getCoarsePointerSnapshot,
    getCoarsePointerServerSnapshot,
  );
  const [liveMessage, setLiveMessage] = useState("");
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

  const copyEmail = useCallback(async (): Promise<CopyStatus> => {
    try {
      await writeClipboard(EMAIL);
      setStatus("copied");
      scheduleReset();
      return "copied";
    } catch {
      try {
        fallbackCopy(EMAIL);
        setStatus("copied");
        scheduleReset();
        return "copied";
      } catch {
        setStatus("failed");
        scheduleReset();
        return "failed";
      }
    }
  }, []);

  async function handleFooterTouchActivate() {
    if (revealed) {
      return;
    }
    setRevealed(true);
    const result = await copyEmail();
    setLiveMessage(
      result === "copied" ? "Email address copied" : "Email address shown",
    );
  }

  async function handleDefaultClick() {
    const result = await copyEmail();
    setLiveMessage(
      result === "copied"
        ? "Email address copied"
        : result === "failed"
          ? `Could not copy. The email is ${EMAIL}`
          : "",
    );
  }

  const footerClass = footerTouch ? "contact-link--footer" : "";
  const menuClass = menuLink ? "contact-link--menu" : "";
  const touchReveal = footerTouch || menuLink;
  const showEmailInDom = !touchReveal || (touchReveal && !coarsePointer);
  const footerTouchMode = touchReveal && coarsePointer;

  if (footerTouchMode && revealed) {
    return (
      <span
        className={`contact-copy contact-copy--revealed ${className}`.trim()}
        data-copy-status={status}
      >
        <a
          href={`mailto:${EMAIL}`}
          className={`contact-link ${footerClass} contact-link--revealed inline-flex min-h-11 items-center text-[var(--color-ink)] transition-colors hover:text-[var(--color-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ink)]`}
        >
          {EMAIL}
        </a>
        {status === "copied" ? (
          <span
            className="contact-copy__status contact-copy__status--inline"
            aria-hidden="true"
          >
            Copied
          </span>
        ) : null}
        <span className="sr-only" aria-live="polite">
          {liveMessage}
        </span>
      </span>
    );
  }

  return (
    <span className={`contact-copy ${className}`.trim()} data-copy-status={status}>
      <button
        type="button"
        onClick={() => {
          if (footerTouchMode) {
            void handleFooterTouchActivate();
          } else {
            void handleDefaultClick();
          }
        }}
        onKeyDown={(event) => {
          if (
            touchReveal &&
            !coarsePointer &&
            (event.key === "Enter" || event.key === " ")
          ) {
            setRevealed(true);
            setLiveMessage("Email address shown");
          }
        }}
        onFocus={
          touchReveal && !coarsePointer
            ? () => {
                setRevealed(true);
                setLiveMessage("Email address shown");
              }
            : undefined
        }
        aria-label={
          footerTouchMode ? "Show contact email" : `Copy email address ${EMAIL}`
        }
        aria-expanded={touchReveal ? revealed : undefined}
        className={`contact-link contact-link--tap ${footerClass} ${menuClass} inline-flex items-center text-[var(--color-ink)] transition-colors hover:text-[var(--color-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ink)] ${
          menuLink
            ? "min-h-0 min-w-0 justify-start p-0"
            : "min-h-11 min-w-11 justify-center"
        }`.trim()}
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
        {showEmailInDom ? (
          <span className="contact-link__email">{EMAIL}</span>
        ) : null}
      </button>

      <span className="sr-only" aria-live="polite">
        {liveMessage}
      </span>

      {!footerTouch && !menuLink && status === "failed" ? (
        <span className="contact-copy__status contact-copy__status--failed">
          Couldn&apos;t copy
        </span>
      ) : null}

      {status === "copied" &&
      !(touchReveal && coarsePointer && revealed) ? (
        <span
          className={`contact-copy__status${
            touchReveal && coarsePointer ? " contact-copy__status--inline" : ""
          }`}
          aria-hidden={footerTouch ? undefined : true}
        >
          {touchReveal ? "Copied" : "Copied!"}
        </span>
      ) : null}
    </span>
  );
}
