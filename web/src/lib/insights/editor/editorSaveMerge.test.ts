import { describe, expect, it } from "vitest";

import type { InsightArticleDetail } from "@/lib/adminInsightsApi";
import { emptyInsightDocument } from "@/lib/insights/document";
import { mergeSavedArticlePreservingEditorBody } from "@/lib/insights/editor/editorSaveMerge";

const serverBody = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Server normalised text" }],
    },
  ],
};

const editorBody = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "What the author is typing" }],
    },
  ],
};

const savedArticle: InsightArticleDetail = {
  id: 1,
  slug: "test",
  title: "Title",
  excerpt: "Excerpt",
  category_id: 1,
  category_name: "Foundations",
  published_at: null,
  body_json: serverBody,
  featured_image_key: null,
  featured_image_url: null,
  featured_image_alt: null,
  featured_image_caption: null,
  seo_title: null,
  meta_description: null,
  version: 4,
  status: "draft",
  updated_at: "2026-01-01T00:00:00Z",
  created_at: "2025-12-01T00:00:00Z",
  save_notices: ["Link normalised."],
};

describe("mergeSavedArticlePreservingEditorBody", () => {
  it("keeps the in-editor body after autosave metadata refresh", () => {
    const current = {
      title: "Title",
      slug: "test",
      excerpt: "Excerpt",
      categoryId: 1,
      publishedAt: "",
      bodyJson: editorBody,
      featuredImageKey: null,
      featuredImageUrl: null,
      featuredImageAlt: "",
      featuredImageCaption: "",
      seoTitle: "",
      metaDescription: "",
      version: 3,
      status: "draft" as const,
    };

    const merged = mergeSavedArticlePreservingEditorBody(current, savedArticle);

    expect(merged.version).toBe(4);
    expect(merged.bodyJson).toEqual(editorBody);
    expect(merged.bodyJson).not.toEqual(serverBody);
  });

  it("does not collapse to empty when server body differs", () => {
    const current = {
      title: "",
      slug: "",
      excerpt: "",
      categoryId: null,
      publishedAt: "",
      bodyJson: editorBody,
      featuredImageKey: null,
      featuredImageUrl: null,
      featuredImageAlt: "",
      featuredImageCaption: "",
      seoTitle: "",
      metaDescription: "",
      version: 1,
      status: "draft" as const,
    };

    const merged = mergeSavedArticlePreservingEditorBody(current, {
      ...savedArticle,
      body_json: emptyInsightDocument(),
    });

    expect(merged.bodyJson).toEqual(editorBody);
  });
});
