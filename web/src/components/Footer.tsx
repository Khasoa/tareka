import Link from "next/link";
import CardLink from "@/components/CardLink";
import ContactLink from "@/components/ContactLink";
import DirectoryAnchor from "@/components/DirectoryAnchor";
import Wordmark from "@/components/Wordmark";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer-surface relative isolate overflow-x-hidden border-t border-[var(--color-border)] py-12 sm:py-14">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 top-10 flex items-end justify-center overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to bottom, var(--color-ink) 40%, transparent 92%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, var(--color-ink) 40%, transparent 92%)",
        }}
      >
        <Wordmark className="wordmark-ghost select-none" />
      </div>

      <div className="page-shell relative">
        <div className="footer-layout flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="footer-brand order-1 max-w-xs sm:order-none">
            <CardLink
              href="/intro"
              direction="down"
              aria-label="tareka intro"
              className="inline-block text-xl tracking-tight text-[var(--color-ink)] sm:text-[1.5rem]"
            >
              <Wordmark />
            </CardLink>

            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Kenya&apos;s recovery directory.
            </p>

            <p
              className="mt-3 hidden text-xs text-[var(--color-muted)] sm:block"
              suppressHydrationWarning
            >
              © {year} tareka — all rights reserved.
            </p>
          </div>

          <div className="footer-links order-2 flex flex-col gap-3 sm:order-none sm:items-end">
            <nav
              aria-label="Directory"
              className="footer-nav-directory order-2 text-sm sm:order-none sm:text-right"
            >
              <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:justify-end">
                <li>
                  <Link href="/" className="link-accent text-[var(--color-ink)]">
                    Directory
                  </Link>
                </li>
                <li>
                  <Link href="/insights" className="link-accent text-[var(--color-ink)]">
                    Insights
                  </Link>
                </li>
                <li>
                  <Link href="/suggest" className="link-accent text-[var(--color-ink)]">
                    Suggest a business
                  </Link>
                </li>
              </ul>
            </nav>

            <nav
              aria-label="Connect"
              className="footer-nav-connect order-3 text-sm sm:order-none sm:text-right"
            >
              <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:justify-end">
                <li>
                  <ContactLink footerTouch showExternalIcon />
                </li>
                <li>
                  <a
                    href="https://www.linkedin.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center text-[var(--color-ink)] transition-colors hover:text-[var(--color-muted)]"
                  >
                    LinkedIn <span aria-hidden="true">↗</span>
                  </a>
                </li>
              </ul>
            </nav>

            <nav
              aria-label="Legal"
              className="footer-legal-desktop hidden flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[var(--color-muted)] sm:flex sm:justify-end"
            >
              <Link
                href="/privacy"
                className="transition-colors hover:text-[var(--color-ink)]"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="transition-colors hover:text-[var(--color-ink)]"
              >
                Terms
              </Link>
            </nav>

            <DirectoryAnchor className="footer-cta btn-primary order-4 mt-1 w-fit sm:order-none">
              Find a place
            </DirectoryAnchor>
          </div>

          <div className="footer-legal-mobile order-5 text-xs text-[var(--color-muted)] sm:hidden">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link
                href="/privacy"
                className="transition-colors hover:text-[var(--color-ink)]"
              >
                Privacy
              </Link>
              <span aria-hidden="true">·</span>
              <Link
                href="/terms"
                className="transition-colors hover:text-[var(--color-ink)]"
              >
                Terms
              </Link>
            </p>
            <p className="mt-2" suppressHydrationWarning>
              © {year} tareka
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
