/** Tiptap JSON document helpers for Insights articles. */

export type TiptapMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  text?: string;
  marks?: TiptapMark[];
  content?: TiptapNode[];
};

export function emptyInsightDocument(): TiptapNode {
  return {
    type: "doc",
    content: [],
  };
}

export function documentFromJson(value: unknown): TiptapNode {
  if (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value as TiptapNode).type === "doc"
  ) {
    return value as TiptapNode;
  }
  return emptyInsightDocument();
}
