"use client";

import { useState } from "react";
import Link from "next/link";
import CardLink from "@/components/CardLink";
import ContactLink from "@/components/ContactLink";
import DirectoryAnchor from "@/components/DirectoryAnchor";
import Wordmark from "@/components/Wordmark";

export default function Header() {
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  return (
    <header className="site-header sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-paper)]">
      <div className="page-shell grid grid-cols-3 items-center py-2.5 sm:py-3">
        <CardLink
          href="/intro"
          direction="down"
          onNavigate={closeMenu}
          aria-label="tareka intro"
          className="justify-self-start text-[1.2rem] tracking-tight text-[var(--color-ink)] sm:text-[1.3rem]"
        >
          <Wordmark />
        </CardLink>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="flex size-9 items-center justify-center justify-self-center rounded-full text-xl font-light leading-none text-[var(--color-ink)] transition-colors hover:bg-[var(--color-accent-soft)]"
        >
          <span
            className={`block transition-transform duration-200 ${
              open ? "rotate-45" : ""
            }`}
          >
            +
          </span>
        </button>

        <DirectoryAnchor
          onNavigate={closeMenu}
          className="btn-primary justify-self-end whitespace-nowrap px-3 text-xs sm:px-5 sm:text-sm"
        >
          Find a place
        </DirectoryAnchor>
      </div>

      {open && (
        <div className="border-t border-[var(--color-border)] px-6 py-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mx-auto max-w-2xl text-balance text-xl font-medium leading-snug tracking-tight sm:text-2xl">
              Waste is just a material waiting for its next life.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-x-10 gap-y-8 border-t border-[var(--color-border)] pt-10 sm:grid-cols-[2fr_1px_1fr_1px_1fr]">
            <div>
              <p className="kicker">About</p>

              <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
                tareka is a directory of Kenya&apos;s recycling, collection
                and upcycling businesses — a growing index of the people and
                places keeping materials in motion. Listings are researched
                before they are published.
              </p>

              <div className="mt-4 flex flex-col items-start gap-3">
                <Link
                  href="/how-it-works"
                  onClick={closeMenu}
                  className="link-row text-sm"
                >
                  <span className="link-accent">How it works</span>
                  <span className="link-arrow" aria-hidden="true">
                    →
                  </span>
                </Link>

                <Link
                  href="/suggest"
                  onClick={closeMenu}
                  className="link-row text-sm"
                >
                  <span className="link-accent">Suggest a business</span>
                  <span className="link-arrow" aria-hidden="true">
                    →
                  </span>
                </Link>
              </div>
            </div>

            <div className="hidden bg-[var(--color-border)] sm:block" />

            <div>
              <p className="kicker">Explore</p>

              <ul className="mt-3 space-y-3 text-sm">
                <li>
                  <Link
                    href="/"
                    onClick={closeMenu}
                    className="link-row"
                  >
                    <span className="link-accent">Directory</span>
                    <span className="link-arrow" aria-hidden="true">
                      →
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/insights"
                    onClick={closeMenu}
                    className="link-row"
                  >
                    <span className="link-accent">Insights</span>
                    <span className="link-arrow" aria-hidden="true">
                      →
                    </span>
                  </Link>
                </li>
              </ul>
            </div>

            <div className="hidden bg-[var(--color-border)] sm:block" />

            <div>
              <p className="kicker">Connect</p>

              <ul className="mt-3 space-y-3 text-sm text-[var(--color-ink)]">
                <li>
                  <a
                    href="https://www.linkedin.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="transition-colors hover:text-[var(--color-muted)]"
                  >
                    LinkedIn <span aria-hidden="true">↗</span>
                  </a>
                </li>
                <li>
                  <ContactLink showExternalIcon />
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
