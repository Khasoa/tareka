import { normalizeLinkHref } from "@/lib/insights/editor/linkHref";

export { healDocumentLinks, normalizeLinkHref } from "@/lib/insights/editor/linkHref";
export const sanitizeLinkHref = normalizeLinkHref;

export function isMeaningfulHtml(html: string): boolean {
  const trimmed = html.trim();
  if (!trimmed) return false;
  if (typeof DOMParser === "undefined") {
    return /<(?:p|h[1-6]|ul|ol|li|blockquote|div|br|strong|em|a)\b/i.test(
      trimmed,
    );
  }
  const doc = new DOMParser().parseFromString(trimmed, "text/html");
  const text = (doc.body.textContent ?? "").replace(/\u00a0/g, " ").trim();
  return text.length > 0;
}

export function looksLikeMarkdown(text: string): boolean {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return false;

  let signals = 0;
  for (const line of lines) {
    if (/^#{1,6}\s+\S/.test(line)) signals += 1;
    if (/^[-*+]\s+\S/.test(line)) signals += 1;
    if (/^\d+\.\s+\S/.test(line)) signals += 1;
    if (/^>\s+\S/.test(line)) signals += 1;
  }

  if (/^#{1,6}\s+\S/.test(lines[0] ?? "")) {
    return signals >= 1;
  }

  return signals >= 2;
}

const BLOCK_TAGS = new Set([
  "P",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "UL",
  "OL",
  "LI",
  "BLOCKQUOTE",
]);

function unwrapElement(element: Element) {
  const parent = element.parentNode;
  if (!parent) return;
  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }
  parent.removeChild(element);
}

function normalizeHeadingTag(tagName: string): "h2" | "h3" {
  if (tagName === "H1" || tagName === "H2") return "h2";
  return "h3";
}

function sanitizeElement(root: ParentNode) {
  const walker = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      node.parentNode?.removeChild(node);
      return;
    }

    const element = node as Element;
    const tag = element.tagName;

    if (tag === "SCRIPT" || tag === "STYLE" || tag === "META" || tag === "LINK") {
      element.remove();
      return;
    }

    if (tag === "SPAN" || tag === "FONT" || tag === "B" || tag === "STRONG") {
      // keep semantic tags; strip span/font wrappers
    }

    if (tag === "SPAN" || tag === "FONT" || tag === "DIV") {
      const onlyInline =
        element.childNodes.length > 0 &&
        [...element.childNodes].every(
          (child) =>
            child.nodeType === Node.TEXT_NODE ||
            (child.nodeType === Node.ELEMENT_NODE &&
              !BLOCK_TAGS.has((child as Element).tagName)),
        );
      if (onlyInline || tag === "FONT" || tag === "SPAN") {
        unwrapElement(element);
        return;
      }
      if (tag === "DIV") {
        const replacement = element.ownerDocument.createElement("p");
        while (element.firstChild) {
          replacement.appendChild(element.firstChild);
        }
        element.replaceWith(replacement);
        for (const child of [...replacement.childNodes]) {
          walker(child);
        }
        return;
      }
    }

    if (tag === "B") {
      const strong = element.ownerDocument.createElement("strong");
      strong.innerHTML = element.innerHTML;
      element.replaceWith(strong);
      for (const child of [...strong.childNodes]) walker(child);
      return;
    }

    if (tag === "I") {
      const em = element.ownerDocument.createElement("em");
      em.innerHTML = element.innerHTML;
      element.replaceWith(em);
      for (const child of [...em.childNodes]) walker(child);
      return;
    }

    if (/^H[1-6]$/.test(tag)) {
      const level = normalizeHeadingTag(tag);
      const heading = element.ownerDocument.createElement(level);
      heading.textContent = element.textContent ?? "";
      element.replaceWith(heading);
      return;
    }

    if (tag === "A") {
      const href = sanitizeLinkHref(element.getAttribute("href") ?? "");
      if (!href) {
        unwrapElement(element);
        return;
      }
      element.setAttribute("href", href);
      element.removeAttribute("style");
      element.removeAttribute("class");
      element.removeAttribute("target");
      element.removeAttribute("rel");
    } else if (BLOCK_TAGS.has(tag) || tag === "BR") {
      [...element.attributes].forEach((attr) => {
        if (attr.name !== "href") {
          element.removeAttribute(attr.name);
        }
      });
    } else {
      unwrapElement(element);
      return;
    }

    for (const child of [...element.childNodes]) {
      walker(child);
    }
  };

  for (const child of [...root.childNodes]) {
    walker(child);
  }
}

export function sanitizePastedHtml(html: string): string {
  if (typeof DOMParser === "undefined") {
    return html;
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  sanitizeElement(doc.body);
  return doc.body.innerHTML.trim();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function inlineMarkdownToHtml(text: string): string {
  let result = escapeHtml(text);
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/_(.+?)_/g, "<em>$1</em>");
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, label, href) => {
      const safeHref = sanitizeLinkHref(String(href));
      if (!safeHref) return label;
      return `<a href="${escapeHtml(safeHref)}">${label}</a>`;
    },
  );
  return result;
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length <= 2 ? "h2" : "h3";
      blocks.push(
        `<${level}>${inlineMarkdownToHtml(headingMatch[2] ?? "")}</${level}>`,
      );
      index += 1;
      continue;
    }

    if (/^>\s+/.test(trimmed)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index]?.trim() ?? "")) {
        quoteLines.push(
          (lines[index] ?? "").trim().replace(/^>\s?/, ""),
        );
        index += 1;
      }
      blocks.push(
        `<blockquote><p>${quoteLines.map(inlineMarkdownToHtml).join("<br>")}</p></blockquote>`,
      );
      continue;
    }

    if (/^[-*+]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*+]\s+/.test(lines[index]?.trim() ?? "")) {
        items.push(
          (lines[index] ?? "").trim().replace(/^[-*+]\s+/, ""),
        );
        index += 1;
      }
      blocks.push(
        `<ul>${items.map((item) => `<li><p>${inlineMarkdownToHtml(item)}</p></li>`).join("")}</ul>`,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index]?.trim() ?? "")) {
        items.push(
          (lines[index] ?? "").trim().replace(/^\d+\.\s+/, ""),
        );
        index += 1;
      }
      blocks.push(
        `<ol>${items.map((item) => `<li><p>${inlineMarkdownToHtml(item)}</p></li>`).join("")}</ol>`,
      );
      continue;
    }

    const paragraphLines: string[] = [trimmed];
    index += 1;
    while (index < lines.length && lines[index]?.trim()) {
      const next = lines[index]?.trim() ?? "";
      if (
        /^#{1,6}\s+/.test(next) ||
        /^[-*+]\s+/.test(next) ||
        /^\d+\.\s+/.test(next) ||
        /^>\s+/.test(next)
      ) {
        break;
      }
      paragraphLines.push(next);
      index += 1;
    }
    blocks.push(`<p>${paragraphLines.map(inlineMarkdownToHtml).join("<br>")}</p>`);
  }

  return blocks.join("");
}

export type PasteResolution =
  | { kind: "html"; html: string }
  | { kind: "plain"; text: string };

export type EditorPasteDisposition =
  | { kind: "html"; html: string }
  | "use-default";

/**
 * Resolve clipboard data for the editor. When this returns html, the caller
 * must insert it once and tell ProseMirror the paste was handled (return true).
 */
export function dispositionForEditorPaste(
  clipboardData: Pick<DataTransfer, "getData"> | null | undefined,
): EditorPasteDisposition {
  if (!clipboardData) {
    return "use-default";
  }

  const html = clipboardData.getData("text/html");
  const plain = clipboardData.getData("text/plain");
  const resolved = resolvePasteContent(html || undefined, plain);

  if (resolved.kind === "plain") {
    return "use-default";
  }

  return { kind: "html", html: resolved.html };
}

export function resolvePasteContent(
  html: string | undefined,
  plainText: string,
): PasteResolution {
  if (html && isMeaningfulHtml(html)) {
    return { kind: "html", html: sanitizePastedHtml(html) };
  }

  const text = plainText.replace(/\r\n/g, "\n");
  if (looksLikeMarkdown(text)) {
    return { kind: "html", html: sanitizePastedHtml(markdownToHtml(text)) };
  }

  return { kind: "plain", text };
}
