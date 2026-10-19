type WordmarkProps = {
  className?: string;
};

/**
 * `tareka` plus a small raised circle at the top-right of the final a.
 * Decorative mark is aria-hidden; set an accessible name on the parent.
 */
export default function Wordmark({ className = "" }: WordmarkProps) {
  return (
    <span className={`wordmark ${className}`.trim()}>
      tareka
      <span className="wordmark-period" aria-hidden="true" />
    </span>
  );
}
