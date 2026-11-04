import type { AnchorHTMLAttributes, ReactNode } from "react";

type InkExternalLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  arrow?: "↗" | "→";
};

/** External link with black underline on words only (arrow not underlined). */
export function InkExternalLink({
  children,
  arrow = "↗",
  className = "",
  ...props
}: InkExternalLinkProps) {
  return (
    <a
      className={`business-detail-body-link ${className}`.trim()}
      {...props}
    >
      <span className="business-detail-body-link__text">{children}</span>
      <span className="business-detail-body-link__arrow" aria-hidden="true">
        {arrow}
      </span>
    </a>
  );
}
