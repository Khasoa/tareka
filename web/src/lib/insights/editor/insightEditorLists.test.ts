import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, it, afterEach } from "vitest";

import { InsightEditorLink } from "@/lib/insights/editor/insightLink";

function createEditor(content?: object) {
  return new Editor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      InsightEditorLink,
    ],
    content,
  });
}

describe("Insight editor lists (StarterKit)", () => {
  let editor: Editor | null = null;

  afterEach(() => {
    editor?.destroy();
    editor = null;
  });

  it("toggles bullet list on the current paragraph", () => {
    editor = createEditor({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Item one" }],
        },
      ],
    });

    expect(editor.isActive("bulletList")).toBe(false);
    editor.chain().focus().toggleBulletList().run();
    expect(editor.isActive("bulletList")).toBe(true);
    expect(editor.getJSON().content?.[0]?.type).toBe("bulletList");

    editor.chain().focus().toggleBulletList().run();
    expect(editor.isActive("bulletList")).toBe(false);
    expect(editor.getJSON().content?.[0]?.type).toBe("paragraph");
  });

  it("toggles ordered list on the current paragraph", () => {
    editor = createEditor({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "First" }],
        },
      ],
    });

    editor.chain().focus().toggleOrderedList().run();
    expect(editor.isActive("orderedList")).toBe(true);
    expect(editor.getJSON().content?.[0]?.type).toBe("orderedList");
  });

  it("switches list type while keeping item text", () => {
    editor = createEditor({
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Shared text" }],
                },
              ],
            },
          ],
        },
      ],
    });

    editor.chain().focus().toggleOrderedList().run();
    const block = editor.getJSON().content?.[0];
    expect(block?.type).toBe("orderedList");
    const listItem = block?.content?.[0];
    const paragraph =
      listItem && "content" in listItem ? listItem.content?.[0] : undefined;
    const text =
      paragraph && "content" in paragraph
        ? paragraph.content?.[0]?.text
        : undefined;
    expect(text).toBe("Shared text");
  });

  it("supports keyboard shortcuts for bullet and ordered lists", () => {
    editor = createEditor({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Line" }],
        },
      ],
    });

    editor.view.dom.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "8",
        code: "Digit8",
        shiftKey: true,
        ctrlKey: true,
        bubbles: true,
      }),
    );
    expect(editor.isActive("bulletList")).toBe(true);

    editor.chain().focus().clearNodes().run();
    editor.commands.setContent({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Line" }],
        },
      ],
    });

    editor.view.dom.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "7",
        code: "Digit7",
        shiftKey: true,
        ctrlKey: true,
        bubbles: true,
      }),
    );
    expect(editor.isActive("orderedList")).toBe(true);
  });
});
