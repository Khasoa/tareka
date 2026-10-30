"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { finishCardTransition } from "@/lib/cardTransition";

export default function CardTransitionGate() {
  const pathname = usePathname();

  useEffect(() => {
    finishCardTransition();
  }, [pathname]);

  return null;
}