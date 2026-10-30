"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export default function HideOnIntro({ children }: { children: ReactNode }) {
  return usePathname() === "/intro" ? null : <>{children}</>;
}