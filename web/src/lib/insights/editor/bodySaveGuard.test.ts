import { describe, expect, it } from "vitest";

import { emptyInsightDocument } from "@/lib/insights/document";
import {
  createBodySaveSession,
  decideBodySave,
  documentHasVisibleContent,
  noteUserBodyEdit,
} from "@/lib/insights/editor/bodySaveGuard";

const sampleBody = {
  type: "doc" as const,
  content: [
    {
      type: "paragraph" as const,
      content: [{ type: "text" as const, text: "Hello" }],
    },
  ],
};

describe("decideBodySave", () => {
  it("does not include empty body when server had content and user never edited", () => {
    const session = createBodySaveSession(sampleBody);
    expect(
      decideBodySave(session, emptyInsightDocument()),
    ).toEqual({ includeBodyJson: false, allowEmptyBody: false });
  });

  it("includes empty body after user deliberately cleared visible content", () => {
    const session = createBodySaveSession(sampleBody);
    noteUserBodyEdit(session, sampleBody);
    noteUserBodyEdit(session, emptyInsightDocument());
    expect(
      decideBodySave(session, emptyInsightDocument()),
    ).toEqual({ includeBodyJson: true, allowEmptyBody: true });
  });

  it("includes non-empty body even without user edit flag", () => {
    const session = createBodySaveSession(emptyInsightDocument());
    expect(decideBodySave(session, sampleBody)).toEqual({
      includeBodyJson: true,
      allowEmptyBody: false,
    });
  });
});

describe("documentHasVisibleContent", () => {
  it("ignores whitespace-only text", () => {
    const doc = {
      type: "doc" as const,
      content: [
        {
          type: "paragraph" as const,
          content: [{ type: "text" as const, text: "   " }],
        },
      ],
    };
    expect(documentHasVisibleContent(doc)).toBe(false);
  });

  it("counts text inside lists, headings, and blockquotes", () => {
    const listOnly = {
      type: "doc" as const,
      content: [
        {
          type: "bulletList" as const,
          content: [
            {
              type: "listItem" as const,
              content: [
                {
                  type: "paragraph" as const,
                  content: [{ type: "text" as const, text: "Item" }],
                },
              ],
            },
          ],
        },
      ],
    };
    const headingOnly = {
      type: "doc" as const,
      content: [
        {
          type: "heading" as const,
          attrs: { level: 2 },
          content: [{ type: "text" as const, text: "Title" }],
        },
      ],
    };
    const quoteOnly = {
      type: "doc" as const,
      content: [
        {
          type: "blockquote" as const,
          content: [
            {
              type: "paragraph" as const,
              content: [{ type: "text" as const, text: "Quote" }],
            },
          ],
        },
      ],
    };
    expect(documentHasVisibleContent(listOnly)).toBe(true);
    expect(documentHasVisibleContent(headingOnly)).toBe(true);
    expect(documentHasVisibleContent(quoteOnly)).toBe(true);
  });
});
