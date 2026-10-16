import Link from "next/link";
import DirectoryAnchor from "@/components/DirectoryAnchor";
import Wordmark from "@/components/Wordmark";

export default function Footer() {
  return (
    <footer className="footer-surface relative isolate overflow-hidden border-t border-[var(--color-border)] px-6 py-12 sm:py-14">
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

      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xs">
            <span
              className="text-xl tracking-tight text-[var(--color-ink)] sm:text-[1.5rem]"
              aria-label="tareka"
            >
              <Wordmark />
            </span>

            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Kenya&apos;s recovery directory.
            </p>

            <p
              className="mt-3 text-xs text-[var(--color-muted)]"
              suppressHydrationWarning
            >
              © {new Date().getFullYear()} tareka — all rights reserved.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:items-end">
            <nav aria-label="Directory" className="text-sm sm:text-right">
              <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:justify-end">
                <li>
                  <Link href="/#directory" className="link-accent text-[var(--color-ink)]">
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

            <nav aria-label="Connect" className="text-sm sm:text-right">
              <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:justify-end">
                <li>
                  <a
                    href="mailto:hello@tareka.co"
                    className="text-[var(--color-ink)] transition-colors hover:text-[var(--color-muted)]"
                  >
                    Contact <span aria-hidden="true">↗</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.linkedin.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--color-ink)] transition-colors hover:text-[var(--color-muted)]"
                  >
                    LinkedIn <span aria-hidden="true">↗</span>
                  </a>
                </li>
              </ul>
            </nav>

            <nav
              aria-label="Legal"
              className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[var(--color-muted)] sm:justify-end"
            >
              <Link href="/privacy" className="link-accent-quiet">
                Privacy
              </Link>
              <Link href="/terms" className="link-accent-quiet">
                Terms
              </Link>
            </nav>

            <DirectoryAnchor className="btn-primary mt-1 w-fit">
              Find a place
            </DirectoryAnchor>
          </div>
        </div>
      </div>
    </footer>
  );
}
