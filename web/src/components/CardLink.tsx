"use client";

import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { startCardTransition } from "@/lib/cardTransition";

type Props = {
  href: string;
  direction: "up" | "down";
  className?: string;
  children: ReactNode;
  onNavigate?: () => void;
  "aria-label"?: string;
};

export default function CardLink({
  href,
  direction,
  className,
  children,
  onNavigate,
  ...rest
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onNavigate?.();

    // New-tab and modified clicks behave normally.
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();
    if (pathname === href) return;
    startCardTransition(direction, () => router.push(href));
  }

  return (
    <Link href={href} onClick={handleClick} className={className} {...rest}>
      {children}
    </Link>
  );
}