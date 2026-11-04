import type { TiptapNode } from "@/lib/insights/document";

const UNSAFE_SCHEME = /^(javascript|data|vbscript|file):/i;

/** Normalise editor link targets for storage (http(s), mailto, site-relative). */
export function normalizeLinkHref(rawHref: string): string | null {
  if (typeof rawHref !== "string") {
    return null;
  }

  const value = rawHref.trim();
  if (!value) {
    return null;
  }

  if (UNSAFE_SCHEME.test(value)) {
    return null;
  }
  if (value.startsWith("//")) {
    return null;
  }

  if (value.startsWith("mailto:")) {
    const address = value.slice("mailto:".length).split("?", 1)[0]?.trim() ?? "";
    if (!address.includes("@") || /\s/.test(value)) {
      return null;
    }
    return value;
  }

  if (value.startsWith("/")) {
    if (/\s/.test(value)) {
      return null;
    }
    return value;
  }

  let candidate = value;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(candidate)) {
    candidate = `https://${candidate.replace(/^\/+/, "")}`;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    if (!parsed.hostname) {
      return null;
    }
    if (parsed.username || parsed.password) {
      return null;
    }
    if (/\s/.test(candidate)) {
      return null;
    }
    return candidate;
  } catch {
    return null;
  }
}

/** @deprecated alias — use normalizeLinkHref */
export function sanitizeLinkHref(rawHref: string): string | null {
  return normalizeLinkHref(rawHref);
}

export type HealDocumentResult = {
  document: TiptapNode;
  strippedLinkCount: number;
};

function healMarks(marks: TiptapNode["marks"]): {
  marks: TiptapNode["marks"];
  stripped: number;
} {
  if (!marks?.length) {
    return { marks, stripped: 0 };
  }

  let stripped = 0;
  const kept = marks.flatMap((mark) => {
    if (mark.type !== "link") {
      return [mark];
    }
    const rawHref =
      typeof mark.attrs?.href === "string" ? mark.attrs.href : "";
    const href = normalizeLinkHref(rawHref);
    if (!href) {
      stripped += 1;
      return [];
    }
    return [{ type: "link", attrs: { href } }];
  });

  return {
    marks: kept.length ? kept : undefined,
    stripped,
  };
}

function healNode(node: TiptapNode): { node: TiptapNode; stripped: number } {
  let stripped = 0;
  const next: TiptapNode = { ...node };

  if (node.marks) {
    const healed = healMarks(node.marks);
    stripped += healed.stripped;
    if (healed.marks) {
      next.marks = healed.marks;
    } else {
      delete next.marks;
    }
  }

  if (Array.isArray(node.content)) {
    next.content = node.content.map((child) => {
      const healedChild = healNode(child);
      stripped += healedChild.stripped;
      return healedChild.node;
    });
  }

  return { node: next, stripped };
}

/** Strip invalid link marks; keep link text. Used before save and on recovery load. */
export function healDocumentLinks(document: TiptapNode): HealDocumentResult {
  const healed = healNode(document);
  return {
    document: healed.node,
    strippedLinkCount: healed.stripped,
  };
}
