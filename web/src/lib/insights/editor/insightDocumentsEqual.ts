import type { TiptapNode } from "@/lib/insights/document";

export function insightDocumentsEqual(a: TiptapNode, b: TiptapNode): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
