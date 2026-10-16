"use client";

import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";

type Props = {
  className?: string;
  children: ReactNode;
  onNavigate?: () => void;
};

/** Jump to the start of the directory section, keeping active filters. */
export default function DirectoryAnchor({
  className,
  children,
  onNavigate,
}: Props) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onNavigate?.();
    if (window.location.pathname !== "/") return;

    const target = document.getElementById("directory");
    if (!target) return;

    event.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });

    const query = window.location.search.replace(/^\?/, "");
    const href = query ? `/?${query}#directory` : "/#directory";
    window.history.replaceState(null, "", href);
  }

  return (
    <Link href="/#directory" onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
