import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

/** Full-viewport shell for the intro hero on `/intro`. */
export default function IntroCards({ children }: Props) {
  return (
    <div className="intro">
      <div className="intro__card intro__card--hero">{children}</div>
    </div>
  );
}
