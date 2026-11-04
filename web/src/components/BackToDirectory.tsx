"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";

import { LinkWithArrow } from "@/components/LinkWithArrow";

export default function BackToDirectory() {
  const router = useRouter();

  return (
    <LinkWithArrow
      href="/#directory"
      arrow="←"
      arrowPosition="before"
      className="text-sm font-medium"
      underlineClassName="link-accent"
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        let saved = "";
        try {
          saved = sessionStorage.getItem("directory-params") ?? "";
        } catch {
          // storage unavailable: fall through to the plain link
        }
        if (!saved) return;
        event.preventDefault();
        router.push(`/?${saved}#directory`);
      }}
    >
      Back to directory
    </LinkWithArrow>
  );
}
