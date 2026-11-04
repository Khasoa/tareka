import { describe, expect, it } from "vitest";

import {
  healDocumentLinks,
  normalizeLinkHref,
} from "@/lib/insights/editor/linkHref";

describe("normalizeLinkHref", () => {
  it("accepts site-relative paths", () => {
    expect(normalizeLinkHref("/directory/nairobi")).toBe("/directory/nairobi");
    expect(normalizeLinkHref("/insights/slug")).toBe("/insights/slug");
  });

  it("adds https to bare domains", () => {
    expect(normalizeLinkHref("example.com")).toBe("https://example.com");
    expect(normalizeLinkHref("www.example.com/path")).toBe(
      "https://www.example.com/path",
    );
  });

  it("trims whitespace", () => {
    expect(normalizeLinkHref("  https://example.com  ")).toBe(
      "https://example.com",
    );
  });

  it("rejects unsafe schemes and protocol-relative URLs", () => {
    expect(normalizeLinkHref("javascript:alert(1)")).toBeNull();
    expect(normalizeLinkHref("data:text/html,x")).toBeNull();
    expect(normalizeLinkHref("//evil.example/phish")).toBeNull();
  });
});

describe("healDocumentLinks", () => {
  it("strips invalid link marks but keeps text", () => {
    const { document, strippedLinkCount } = healDocumentLinks({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Bad",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
      ],
    });

    expect(strippedLinkCount).toBe(1);
    expect(document.content?.[0]?.content?.[0]?.marks).toBeUndefined();
    expect(document.content?.[0]?.content?.[0]?.text).toBe("Bad");
  });
});
