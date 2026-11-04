import { describe, expect, it, beforeEach } from "vitest";

import {
  assessRecovery,
  clearArticleRecovery,
  readArticleRecovery,
  writeArticleRecovery,
} from "@/lib/insights/editor/recovery";
import { emptyInsightDocument } from "@/lib/insights/document";

const serverComparable = {
  title: "",
  excerpt: "",
  slug: "draft-abc",
  categoryId: null,
  publishedAt: "",
  bodyJson: emptyInsightDocument(),
  featuredImageKey: null,
  featuredImageAlt: "",
  featuredImageCaption: "",
  seoTitle: "",
  metaDescription: "",
};

describe("article recovery storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("writes and reads recovery snapshots without credentials", () => {
    writeArticleRecovery(42, {
      savedAt: "2026-01-01T00:00:00.000Z",
      version: 3,
      title: "Draft title",
      excerpt: "Excerpt",
      slug: "draft-slug",
      categoryId: 1,
      publishedAt: null,
      bodyJson: emptyInsightDocument(),
      featuredImageKey: null,
      featuredImageAlt: "",
      featuredImageCaption: "",
    });

    const snapshot = readArticleRecovery(42);
    expect(snapshot?.title).toBe("Draft title");
    expect(JSON.stringify(snapshot)).not.toContain("password");
  });

  it("clears recovery entries", () => {
    writeArticleRecovery(1, {
      savedAt: "2026-01-01T00:00:00.000Z",
      version: 1,
      title: "",
      excerpt: "",
      slug: "draft",
      categoryId: null,
      publishedAt: null,
      bodyJson: emptyInsightDocument(),
      featuredImageKey: null,
      featuredImageAlt: "",
      featuredImageCaption: "",
    });
    clearArticleRecovery(1);
    expect(readArticleRecovery(1)).toBeNull();
  });

  it("assessRecovery prefers server when version is newer", () => {
    const snapshot = {
      savedAt: "2026-01-01T00:00:00.000Z",
      version: 2,
      title: "Local",
      excerpt: "",
      slug: "local",
      categoryId: null,
      publishedAt: null,
      bodyJson: emptyInsightDocument(),
      featuredImageKey: null,
      featuredImageAlt: "",
      featuredImageCaption: "",
    };
    expect(assessRecovery(snapshot, 3, serverComparable)).toBe("server_newer");
    expect(assessRecovery(snapshot, 2, serverComparable)).toBe("restorable");
    expect(assessRecovery(null, 1, serverComparable)).toBe("none");
  });

  it("does not offer recovery for identical empty snapshots", () => {
    const snapshot = {
      savedAt: "2026-01-01T00:00:00.000Z",
      version: 1,
      title: "",
      excerpt: "",
      slug: "draft-abc",
      categoryId: null,
      publishedAt: null,
      bodyJson: emptyInsightDocument(),
      featuredImageKey: null,
      featuredImageAlt: "",
      featuredImageCaption: "",
    };
    expect(assessRecovery(snapshot, 1, serverComparable)).toBe("none");
  });

  it("heals invalid link marks when reading recovery from storage", () => {
    writeArticleRecovery(7, {
      savedAt: "2026-01-01T00:00:00.000Z",
      version: 2,
      title: "Draft",
      excerpt: "",
      slug: "draft",
      categoryId: null,
      publishedAt: null,
      bodyJson: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Dir",
                marks: [
                  {
                    type: "link",
                    attrs: {
                      href: "/directory/nairobi",
                      target: "_blank",
                      rel: "noopener",
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      featuredImageKey: null,
      featuredImageAlt: "",
      featuredImageCaption: "",
    });

    const snapshot = readArticleRecovery(7);
    const marks = snapshot?.bodyJson.content?.[0]?.content?.[0]?.marks;
    expect(marks).toEqual([
      { type: "link", attrs: { href: "/directory/nairobi" } },
    ]);
  });
});
