"use client";

type SessionExpiredDialogProps = {
  open: boolean;
  onResume: () => void;
  onDismiss?: () => void;
};

export function SessionExpiredDialog({
  open,
  onResume,
}: SessionExpiredDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        role="dialog"
        aria-labelledby="session-expired-title"
        className="w-full max-w-md rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6 shadow-lg"
      >
        <h2 id="session-expired-title" className="text-xl font-semibold">
          Session expired
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          Your work is still in this editor and a temporary recovery copy is kept in this browser tab.
          Sign in again, then return here and choose continue saving.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="/admin/login"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[var(--radius-control)] bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-[var(--color-inverse)]"
          >
            Open sign-in page
          </a>
          <button
            type="button"
            onClick={onResume}
            className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] px-4 py-2 text-sm font-semibold"
          >
            I&apos;ve signed in — continue
          </button>
        </div>
      </div>
    </div>
  );
}
