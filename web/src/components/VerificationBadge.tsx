import VerifiedMark from "@/components/VerifiedMark";
import { verificationDisplay } from "@/lib/publicLabels";

type VerificationBadgeProps = {
  status: string;
  /** Compact for cards; default for profiles */
  size?: "sm" | "md";
};

export default function VerificationBadge({
  status,
  size = "sm",
}: VerificationBadgeProps) {
  const display = verificationDisplay(status);

  const toneClass =
    display.tone === "verified"
      ? "text-[var(--color-ink)]"
      : "text-[var(--color-muted)]";

  const sizeClass =
    size === "md"
      ? "text-xs tracking-wider"
      : "text-[10px] tracking-wider";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium uppercase ${sizeClass} ${toneClass}`}
    >
      {display.showMark ? <VerifiedMark /> : null}
      {display.label}
    </span>
  );
}
