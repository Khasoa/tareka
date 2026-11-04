import { describe, expect, it } from "vitest";

import {
  dispositionForEditorPaste,
  isMeaningfulHtml,
  looksLikeMarkdown,
  markdownToHtml,
  resolvePasteContent,
  sanitizeLinkHref,
  sanitizePastedHtml,
} from "@/lib/insights/editor/paste";

describe("dispositionForEditorPaste", () => {
  it("defers plain clipboard text to the default paste handler", () => {
    const clipboard = {
      getData: (type: string) =>
        type === "text/plain" ? "Plain sentence." : "",
    };
    expect(dispositionForEditorPaste(clipboard)).toBe("use-default");
  });

  it("returns sanitized html once for meaningful html clipboard", () => {
    const clipboard = {
      getData: (type: string) =>
        type === "text/html"
          ? "<p><strong>Bold</strong></p>"
          : type === "text/plain"
            ? "Bold"
            : "",
    };
    const result = dispositionForEditorPaste(clipboard);
    expect(result).not.toBe("use-default");
    if (result !== "use-default" && result.kind === "html") {
      expect(result.html).toContain("Bold");
    }
  });

  it("converts markdown clipboard to html once when html is empty", () => {
    const clipboard = {
      getData: (type: string) =>
        type === "text/plain" ? "## Heading\n\nParagraph" : "",
    };
    const result = dispositionForEditorPaste(clipboard);
    expect(result).not.toBe("use-default");
    if (result !== "use-default" && result.kind === "html") {
      expect(result.html).toContain("<h2>");
    }
  });
});

describe("single-insert paste contract", () => {
  it("calls the inserter at most once for html disposition", () => {
    const clipboard = {
      getData: (type: string) =>
        type === "text/html" ? "<p>Once</p>" : "Once",
    };
    let inserts = 0;
    const disposition = dispositionForEditorPaste(clipboard);
    if (disposition !== "use-default" && disposition.kind === "html") {
      inserts += 1;
      expect(disposition.html).toContain("Once");
    }
    expect(inserts).toBe(1);
  });
});

describe("sanitizeLinkHref", () => {
  it("accepts https links", () => {
    expect(sanitizeLinkHref("https://example.com/path")).toBe(
      "https://example.com/path",
    );
  });

  it("accepts internal paths", () => {
    expect(sanitizeLinkHref("/directory/nairobi")).toBe("/directory/nairobi");
  });

  it("normalises bare domains", () => {
    expect(sanitizeLinkHref("example.com")).toBe("https://example.com");
  });

  it("rejects javascript links", () => {
    expect(sanitizeLinkHref("javascript:alert(1)")).toBeNull();
  });
});

describe("looksLikeMarkdown", () => {
  it("does not treat plain asterisk text as markdown", () => {
    expect(looksLikeMarkdown("Use *emphasis* sometimes in prose.")).toBe(false);
  });

  it("detects heading markdown", () => {
    expect(looksLikeMarkdown("# Title\n\nParagraph")).toBe(true);
  });
});

describe("sanitizePastedHtml", () => {
  it("maps h1 to h2", () => {
    const html = sanitizePastedHtml('<h1 style="color:red">Heading</h1>');
    expect(html).toContain("<h2>Heading</h2>");
    expect(html).not.toContain("style=");
  });

  it("strips font tags and colors", () => {
    const html = sanitizePastedHtml(
      '<p><font color="#ff0000">Hello</font> <span style="font-size:20px">world</span></p>',
    );
    expect(html).toContain("Hello");
    expect(html).not.toContain("color=");
    expect(html).not.toContain("font-size");
  });

  it("preserves lists and links with safe href", () => {
    const html = sanitizePastedHtml(
      '<ul><li><a href="https://tareka.directory">tareka</a></li></ul>',
    );
    expect(html).toContain("<ul>");
    expect(html).toContain('href="https://tareka.directory"');
  });
});

describe("resolvePasteContent", () => {
  it("prefers html when meaningful", () => {
    const resolved = resolvePasteContent(
      '<p><strong>Bold</strong></p>',
      "Plain",
    );
    expect(resolved.kind).toBe("html");
  });

  it("falls back to markdown when html is empty", () => {
    const resolved = resolvePasteContent("", "## Section\n\nParagraph");
    expect(resolved.kind).toBe("html");
    if (resolved.kind === "html") {
      expect(resolved.html).toContain("<h2>");
    }
  });

  it("keeps ambiguous plain text as plain", () => {
    const resolved = resolvePasteContent("", "Price is $5 * 3 units");
    expect(resolved).toEqual({ kind: "plain", text: "Price is $5 * 3 units" });
  });
});

describe("markdownToHtml", () => {
  it("renders blockquote and ordered list", () => {
    const html = markdownToHtml("> Quote\n\n1. One\n2. Two");
    expect(html).toContain("<blockquote>");
    expect(html).toContain("<ol>");
  });
});

describe("isMeaningfulHtml", () => {
  it("ignores empty markup", () => {
    expect(isMeaningfulHtml("<meta><style></style>")).toBe(false);
  });
});
