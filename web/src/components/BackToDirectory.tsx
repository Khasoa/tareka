"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";

import { LinkWithArrow } from "@/components/LinkWithArrow";

type BackToDirectoryProps = {
  /** Black underline body pattern for /directory/[slug] only. */
  bodyInk?: boolean;
};

export default function BackToDirectory({ bodyInk = false }: BackToDirectoryProps) {
  const router = useRouter();

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    let saved = "";
    try {
      saved = sessionStorage.getItem("directory-params") ?? "";
    } catch {
      // storage unavailable: fall through to the plain link
    }
    if (!saved) return;
    event.preventDefault();
    router.push(`/?${saved}#directory`);
  };

  if (bodyInk) {
    return (
      <Link
        href="/#directory"
        className="business-detail-body-link text-sm font-medium"
        onClick={onClick}
      >
        <span className="business-detail-body-link__arrow" aria-hidden="true">
          ←
        </span>
        <span className="business-detail-body-link__text">Back to directory</span>
      </Link>
    );
  }

  return (
    <LinkWithArrow
      href="/#directory"
      arrow="←"
      arrowPosition="before"
      className="business-detail-back business-detail-ink-link text-sm font-medium"
      underlineClassName="link-text-underline link-text-underline--ink"
      onClick={onClick}
    >
      Back to directory
    </LinkWithArrow>
  );
}
