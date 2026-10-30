"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BackToDirectory() {
  const router = useRouter();

  return (
    <Link
      href="/#directory"
      onClick={(event) => {
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
      className="link-row text-sm font-medium"
    >
      <span className="link-arrow" aria-hidden="true">
        ←
      </span>
      <span className="link-accent">Back to directory</span>
    </Link>
  );
}