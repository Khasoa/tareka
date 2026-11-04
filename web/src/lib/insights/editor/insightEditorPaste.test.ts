import { Editor } from "@tiptap/core";
import { Slice } from "@tiptap/pm/model";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, it, afterEach } from "vitest";

import { dispositionForEditorPaste } from "@/lib/insights/editor/paste";
import { InsightEditorLink } from "@/lib/insights/editor/insightLink";

describe("InsightEditor paste integration", () => {
  let editor: Editor | null = null;

  afterEach(() => {
    editor?.destroy();
    editor = null;
  });

  it("inserts sanitized html exactly once through handlePaste", () => {
    const editorRef: { current: Editor | null } = { current: null };

    editor = new Editor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
          code: false,
          codeBlock: false,
          horizontalRule: false,
        }),
        InsightEditorLink,
      ],
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Before " }],
          },
        ],
      },
      editorProps: {
        handlePaste: (_view, event) => {
          const disposition = dispositionForEditorPaste(event.clipboardData);
          if (disposition === "use-default") {
            return false;
          }
          editorRef.current
            ?.chain()
            .focus()
            .insertContent(disposition.html)
            .run();
          return true;
        },
      },
    });
    editorRef.current = editor;

    const textBefore = editor.getText();
    const handlePaste = editor.options.editorProps?.handlePaste;
    expect(handlePaste).toBeTypeOf("function");

    const clipboard = {
      getData: (type: string) =>
        type === "text/html"
          ? "<p>Pasted</p>"
          : type === "text/plain"
            ? "Pasted"
            : "",
    };

    const handled = handlePaste?.(
      editor.view,
      { clipboardData: clipboard } as ClipboardEvent,
      Slice.empty,
    );

    expect(handled).toBe(true);
    const textAfter = editor.getText();
    expect(textAfter.match(/Pasted/g)?.length ?? 0).toBe(1);
    expect(textAfter).toContain("Before");
    expect(textAfter.length).toBeGreaterThan(textBefore.length);
  });
});
