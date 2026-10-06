"use client";

import { useState } from "react";
import Link from "next/link";

export default function Header() {
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  return (
    <header className="border-b border-[var(--color-border)]">
      <div className="mx-auto grid max-w-6xl grid-cols-3 items-center px-6 py-5">
        <Link
          href="/directory"
          onClick={closeMenu}
          className="justify-self-start text-lg font-semibold tracking-tight text-[var(--color-ink)]"
        >
          tareka<span className="text-[var(--color-accent)]">.</span>
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="justify-self-center flex size-9 items-center justify-center rounded-full text-xl font-light leading-none text-[var(--color-ink)] transition-colors hover:bg-[var(--color-accent-soft)]"
        >
          <span className={`block transition-transform duration-200 ${open ? "rotate-45" : ""}`}>+</span>
        </button>

        <Link
          href="/directory#directory"
          onClick={closeMenu}
          style={{ color: "#fff" }}
          className="justify-self-end rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-medium transition-opacity hover:opacity-85"
        >
          Find a place
        </Link>
      </div>

      {open && (
        <div className="border-t border-[var(--color-border)] px-6 py-10">
          <div className="mx-auto max-w-3xl">
            <p className="text-2xl font-semibold leading-snug sm:text-3xl">
              Waste is just a material waiting for its next life.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-x-10 gap-y-8 border-t border-[var(--color-border)] pt-10 sm:grid-cols-[2fr_1px_1fr_1px_1fr]">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-muted)]">
                About
              </p>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
                Tareka is a directory of Kenya&apos;s recycling, collection and upcycling
                businesses — a growing index of the people and places keeping materials
                in motion. Listing is free; every submission is reviewed, and each
                business&apos;s information is verified before it&apos;s marked as such.
              </p>
              <a
                href="mailto:hello@tareka.co"
                className="mt-3 inline-block text-sm font-medium underline decoration-[#B9E4C4] decoration-[3px] underline-offset-4"
              >
                Suggest a business →
              </a>
            </div>

            <div className="hidden bg-[var(--color-border)] sm:block" />

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Explore
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link
                    href="/directory"
                    onClick={closeMenu}
                    className="underline decoration-[#B9E4C4] decoration-2 underline-offset-4"
                  >
                    Directory
                  </Link>
                </li>
                <li className="text-[var(--color-muted)]">Materials — coming soon</li>
                <li className="text-[var(--color-muted)]">Insights — coming soon</li>
              </ul>
            </div>

            <div className="hidden bg-[var(--color-border)] sm:block" />

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Connect
              </p>
              <ul className="mt-3 space-y-2 text-sm text-[var(--color-ink)]">
                <li>
                  <a
                    href="https://www.linkedin.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="transition-colors hover:text-[var(--color-accent-text)]"
                  >
                    LinkedIn <span aria-hidden="true">↗</span>
                  </a>
                </li>
                <li>
                  <a href="mailto:hello@tareka.co" className="transition-colors hover:text-[var(--color-accent-text)]">
                    Contact <span aria-hidden="true">↗</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}