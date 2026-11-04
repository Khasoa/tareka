import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type LinkWithArrowProps = Omit<ComponentProps<typeof Link>, "children"> & {
  /** Visible link words (underlined); arrow is separate and not underlined. */
  children: ReactNode;
  arrow?: "→" | "←" | "↗";
  arrowPosition?: "before" | "after";
  underlineClassName?: string;
};

/**
 * Text link where the underline covers words only, not the arrow.
 */
export function LinkWithArrow({
  children,
  arrow = "→",
  arrowPosition = "after",
  className = "",
  underlineClassName = "link-text-underline",
  ...props
}: LinkWithArrowProps) {
  const arrowNode = (
    <span className="link-arrow" aria-hidden="true">
      {arrow}
    </span>
  );

  return (
    <Link className={`link-row ${className}`.trim()} {...props}>
      {arrowPosition === "before" ? arrowNode : null}
      <span className={underlineClassName}>{children}</span>
      {arrowPosition === "after" ? arrowNode : null}
    </Link>
  );
}
