import { Editor, type JSONContent } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { describe, expect, it, afterEach } from "vitest";

import { InsightEditorLink } from "@/lib/insights/editor/insightLink";

function createEditor(content?: object) {
  return new Editor({
    extensions: [Document, Paragraph, Text, InsightEditorLink],
    content,
  });
}

function paragraphTextNodes(editor: Editor): JSONContent[] {
  const paragraph = editor.getJSON().content?.[0];
  if (!paragraph || paragraph.type !== "paragraph") {
    return [];
  }
  return paragraph.content ?? [];
}

describe("InsightEditorLink", () => {
  let editor: Editor | null = null;

  afterEach(() => {
    editor?.destroy();
    editor = null;
  });

  it("serialises link marks with href only", () => {
    editor = createEditor({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Example",
              marks: [
                {
                  type: "link",
                  attrs: {
                    href: "https://example.org",
                    target: "_blank",
                    rel: "noopener noreferrer",
                    class: null,
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    const marks = paragraphTextNodes(editor)[0]?.marks ?? [];
    expect(marks).toEqual([
      { type: "link", attrs: { href: "https://example.org" } },
    ]);
  });

  it("does not extend the link mark when typing after it", () => {
    editor = createEditor({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "link",
              marks: [{ type: "link", attrs: { href: "https://example.org" } }],
            },
          ],
        },
      ],
    });

    editor.commands.focus("end");
    editor.commands.insertContent(" plain");

    const nodes = paragraphTextNodes(editor);
    const trailing = nodes.find(
      (node) => node.type === "text" && node.text?.includes("plain"),
    );
    expect(trailing?.marks ?? []).toEqual([]);
  });
});
