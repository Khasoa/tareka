import { LinkWithArrow } from "@/components/LinkWithArrow";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col justify-center px-6 py-16">
      <p className="kicker">404</p>
      <h1 className="page-heading mt-3">Page not found</h1>
      <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
        This page does not exist or is no longer published.
      </p>
      <LinkWithArrow href="/" className="mt-8 text-sm font-medium">
        Back to tareka
      </LinkWithArrow>
    </main>
  );
}
