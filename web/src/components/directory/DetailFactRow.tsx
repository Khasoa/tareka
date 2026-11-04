import type { ReactNode } from "react";

type DetailFactRowProps = {
  label: string;
  children: ReactNode;
};

export function DetailFactRow({ label, children }: DetailFactRowProps) {
  return (
    <>
      <dt className="detail-fact-row__label">{label}</dt>
      <dd className="detail-fact-row__value">{children}</dd>
    </>
  );
}
