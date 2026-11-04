import { describe, expect, it } from "vitest";

import { emptyInsightDocument } from "@/lib/insights/document";
import { applyLatestEditorBodyToForm } from "@/lib/insights/editor/articleEditorBodySync";
import {
  createBodySaveSession,
  decideBodySave,
} from "@/lib/insights/editor/bodySaveGuard";

const pastedBody = {
  type: "doc" as const,
  content: [
    {
      type: "paragraph" as const,
      content: [{ type: "text" as const, text: "Pasted article text" }],
    },
    {
      type: "bulletList" as const,
      content: [
        {
          type: "listItem" as const,
          content: [
            {
              type: "paragraph" as const,
              content: [{ type: "text" as const, text: "List item" }],
            },
          ],
        },
      ],
    },
  ],
};

describe("applyLatestEditorBodyToForm", () => {
  it("includes pasted body on save after flushing from the editor handle", () => {
    const session = createBodySaveSession(emptyInsightDocument());
    const form = {
      title: "Draft",
      slug: "draft-slug",
      excerpt: "Summary",
      categoryId: 1,
      publishedAt: "2026-01-01",
      bodyJson: emptyInsightDocument(),
      featuredImageKey: null,
      featuredImageUrl: null,
      featuredImageAlt: "",
      featuredImageCaption: "",
      seoTitle: "",
      metaDescription: "",
      version: 1,
      status: "draft" as const,
    };

    const synced = applyLatestEditorBodyToForm(form, session, pastedBody);
    expect(decideBodySave(session, synced.bodyJson)).toEqual({
      includeBodyJson: true,
      allowEmptyBody: false,
    });
  });
});
