import Link from "next/link";

type DirectoryCTAProps = {
  material: string;
  label: string;
};

export default function DirectoryCTA({
  material,
  label,
}: DirectoryCTAProps) {
  const query = new URLSearchParams({ material }).toString();

  return (
    <div className="my-8">
      <Link
        href={`/directory?${query}`}
        className="inline-flex items-center gap-2 rounded-full border border-black bg-black px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-heading)]"
      >
        {label}
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}