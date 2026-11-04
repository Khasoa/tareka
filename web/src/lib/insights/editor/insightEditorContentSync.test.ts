import { describe, expect, it, vi } from "vitest";

import { emptyInsightDocument } from "@/lib/insights/document";
import type { TiptapNode } from "@/lib/insights/document";
import {
  applyEditorContentLoad,
  shouldApplyEditorContentLoad,
} from "@/lib/insights/editor/insightEditorContentSync";
import { mergeSavedArticlePreservingEditorBody } from "@/lib/insights/editor/editorSaveMerge";

function mockEditor(json: Record<string, unknown>) {
  const setContent = vi.fn();
  const setTextSelection = vi.fn();
  return {
    getJSON: () => json,
    state: {
      selection: { from: 3, to: 5 },
      doc: { content: { size: 20 } },
    },
    commands: {
      setContent,
      setTextSelection,
    },
  };
}

describe("insightEditorContentSync", () => {
  it("skips setContent when documents already match", () => {
    const doc = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Hi" }] }],
    };
    const editor = mockEditor(doc);

    expect(shouldApplyEditorContentLoad(editor as never, doc as never)).toBe(
      false,
    );
    expect(applyEditorContentLoad(editor as never, doc as never)).toBe(false);
    expect(editor.commands.setContent).not.toHaveBeenCalled();
  });

  it("calls setContent when loading a different document", () => {
    const current = emptyInsightDocument();
    const incoming = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Reloaded" }] },
      ],
    };
    const editor = mockEditor(current);

    expect(applyEditorContentLoad(editor as never, incoming as never)).toBe(
      true,
    );
    expect(editor.commands.setContent).toHaveBeenCalledWith(incoming, {
      emitUpdate: false,
    });
    expect(editor.commands.setTextSelection).toHaveBeenCalledWith({
      from: 3,
      to: 5,
    });
  });

  it("does not setContent after autosave when merged body matches the editor", () => {
    const editorBody: TiptapNode = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "What the author is typing" }],
        },
      ],
    };
    const editor = mockEditor(editorBody as Record<string, unknown>);
    const merged = mergeSavedArticlePreservingEditorBody(
      {
        title: "Title",
        slug: "test",
        excerpt: "",
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
        status: "draft",
      },
      {
        id: 1,
        slug: "test",
        title: "Title",
        excerpt: "",
        category_id: 1,
        category_name: "Foundations",
        published_at: null,
        body_json: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Server normalised text" }],
            },
          ],
        },
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
      },
    );

    expect(shouldApplyEditorContentLoad(editor as never, merged.bodyJson)).toBe(
      false,
    );
    expect(
      applyEditorContentLoad(editor as never, merged.bodyJson),
    ).toBe(false);
    expect(editor.commands.setContent).not.toHaveBeenCalled();
  });

  it("calls setContent on explicit reload when server body differs", () => {
    const editorBody: TiptapNode = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Local edits" }],
        },
      ],
    };
    const serverBody: TiptapNode = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Server version" }],
        },
      ],
    };
    const editor = mockEditor(editorBody as Record<string, unknown>);

    expect(applyEditorContentLoad(editor as never, serverBody)).toBe(true);
    expect(editor.commands.setContent).toHaveBeenCalledWith(serverBody, {
      emitUpdate: false,
    });
  });
});
