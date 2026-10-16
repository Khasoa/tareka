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
      <Link href={`/?${query}`} className="btn-primary">
        {label}
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
