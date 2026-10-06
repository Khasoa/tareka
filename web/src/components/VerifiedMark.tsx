export default function VerifiedMark() {
  return (
    <span
      className="inline-flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] border-[var(--color-border-strong)]"
      style={{ backgroundColor: "#B9E4C4" }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 20 20" className="h-2.5 w-2.5" fill="none">
        <path
          d="M5 10.5L8 13.5L15 6.5"
          stroke="var(--color-ink)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}