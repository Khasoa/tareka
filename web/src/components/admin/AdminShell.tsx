"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", match: (path: string) => path === "/admin" },
  {
    href: "/admin/verification",
    label: "Verification",
    match: (path: string) => path.startsWith("/admin/verification"),
  },
  {
    href: "/admin/suggestions",
    label: "Suggestions",
    match: (path: string) => path.startsWith("/admin/suggestions"),
  },
  {
    href: "/admin/claims",
    label: "Claims",
    match: (path: string) => path.startsWith("/admin/claims"),
  },
] as const;

type AdminShellProps = {
  title: string;
  kicker?: string;
  description?: string;
  children: React.ReactNode;
};

export function AdminShell({
  title,
  kicker = "tareka / admin",
  description,
  children,
}: AdminShellProps) {
  const pathname = usePathname();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-8 sm:px-8 sm:py-10">
      <p className="kicker text-sm font-semibold tracking-wide">{kicker}</p>

      <nav
        aria-label="Admin sections"
        className="mt-4 flex flex-wrap gap-2 border-b border-[var(--color-border-strong)] pb-4"
      >
        {NAV_ITEMS.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-[var(--radius-control)] px-3 py-1.5 text-sm font-semibold transition ${
                active
                  ? "bg-[var(--color-ink)] text-[var(--color-inverse)]"
                  : "border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-heading)] hover:bg-[var(--color-accent-soft)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 border-b border-[var(--color-border-strong)] pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            {description}
          </p>
        )}
      </div>

      {children}
    </main>
  );
}
