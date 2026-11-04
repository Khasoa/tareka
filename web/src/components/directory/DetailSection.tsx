import type { ReactNode } from "react";

type DetailSectionProps = {
  label: string;
  children: ReactNode;
};

/** Labelled block for business detail (About, Facts, future sections). */
export function DetailSection({ label, children }: DetailSectionProps) {
  return (
    <section className="detail-section">
      <h2 className="detail-section__heading kicker">{label}</h2>
      <div className="detail-section__content">{children}</div>
    </section>
  );
}
