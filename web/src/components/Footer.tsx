import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative isolate overflow-hidden border-t border-[var(--color-border)] bg-[var(--color-paper)] px-6 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 top-16 flex items-end justify-center overflow-hidden"
        style={{
          maskImage: "linear-gradient(to bottom, black 55%, transparent 95%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 55%, transparent 95%)",
        }}
      >
        <span className="select-none whitespace-nowrap text-[16vw] font-bold leading-none tracking-tight text-[var(--color-ink)]/[0.05] sm:text-[13vw]">
          tareka.
        </span>
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <span className="text-lg font-semibold tracking-tight text-[var(--color-ink)]">
              tareka<span className="text-[var(--color-accent)]">.</span>
            </span>

            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Kenya&apos;s recovery directory.
            </p>

            <p className="mt-3 text-xs text-[var(--color-muted)]">
              © {new Date().getFullYear()} tareka. All rights reserved.
            </p>
          </div>

          <div className="flex flex-col gap-5 sm:items-end">
            <nav
              aria-label="Footer navigation"
              className="flex flex-wrap gap-x-6 gap-y-2 text-sm"
            >
              <Link
                href="/directory"
                className="text-[var(--color-ink)] underline decoration-[#B9E4C4] decoration-[3px] underline-offset-4 transition-colors hover:text-[var(--color-accent-text)]"
              >
                Directory
              </Link>

              <Link
                href="/suggest"
                className="text-[var(--color-ink)] underline decoration-[#B9E4C4] decoration-[3px] underline-offset-4 transition-colors hover:text-[var(--color-accent-text)]"
              >
                Suggest a business
              </Link>

              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--color-ink)] transition-colors hover:text-[var(--color-accent-text)]"
              >
                LinkedIn <span aria-hidden="true">↗</span>
              </a>

              <a
                href="mailto:hello@tareka.co"
                className="text-[var(--color-ink)] transition-colors hover:text-[var(--color-accent-text)]"
              >
                Contact <span aria-hidden="true">↗</span>
              </a>
            </nav>

            <nav
              aria-label="Legal"
              className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[var(--color-muted)]"
            >
              <Link
                href="/privacy"
                className="underline decoration-[#B9E4C4] decoration-2 underline-offset-2"
              >
                Privacy
              </Link>

              <Link
                href="/terms"
                className="underline decoration-[#B9E4C4] decoration-2 underline-offset-2"
              >
                Terms
              </Link>
            </nav>

            <Link
              href="/directory#directory"
              style={{ color: "#fff" }}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-85"
            >
              Find a place
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}