import Link from "next/link";

type DirectoryCTAProps = {
  href: string;
  label: string;
};

export default function DirectoryCTA({ href, label }: DirectoryCTAProps) {
  return (
    <div className="my-8">
      <Link href={href} className="btn-primary">
        <span>{label}</span>
        <span className="link-arrow" aria-hidden="true">
          →
        </span>
      </Link>
    </div>
  );
}
