"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import type { TiptapNode } from "@/lib/insights/document";
import { emptyInsightDocument } from "@/lib/insights/document";
import {
  applyEditorContentLoad,
  shouldRunEditorContentLoadEffect,
} from "@/lib/insights/editor/insightEditorContentSync";
import { dispositionForEditorPaste } from "@/lib/insights/editor/paste";
import { InsightEditorLink } from "@/lib/insights/editor/insightLink";
import { EditorLinkPopover } from "@/components/insights/editor/EditorLinkPopover";

export type InsightEditorHandle = {
  getDocument: () => TiptapNode;
};

type InsightEditorProps = {
  content: TiptapNode;
  /** Bumps only on initial load, article switch, reload-from-server, or restore recovery. */
  contentLoadRevision: number;
  onUpdate: (document: TiptapNode) => void;
  editable?: boolean;
};

function ToolbarButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`rounded-[var(--radius-control)] px-2.5 py-1.5 text-sm font-semibold transition ${
        active
          ? "insight-editor-toolbar-btn--active"
          : "border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-heading)] hover:bg-[var(--color-accent-soft)]"
      }`}
    >
      {label}
    </button>
  );
}

export const InsightEditor = forwardRef<InsightEditorHandle, InsightEditorProps>(
  function InsightEditor(
    { content, contentLoadRevision, onUpdate, editable = true },
    ref,
  ) {
    const syncingContent = useRef(false);
    const onUpdateRef = useRef(onUpdate);
    const editorRef = useRef<Editor | null>(null);
    const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
    const loadedRevisionRef = useRef(-1);
    const pendingContentRef = useRef(content);

    useEffect(() => {
      onUpdateRef.current = onUpdate;
    }, [onUpdate]);

    useEffect(() => {
      pendingContentRef.current = content;
    }, [content, contentLoadRevision]);

    const extensions = useMemo(
      () => [
        StarterKit.configure({
          heading: { levels: [2, 3] },
          code: false,
          codeBlock: false,
          horizontalRule: false,
        }),
        InsightEditorLink,
        Placeholder.configure({
          placeholder: "Write your article…",
        }),
      ],
      [],
    );

    const editor = useEditor(
      {
        extensions,
        content: emptyInsightDocument(),
        editable,
        immediatelyRender: false,
        editorProps: {
          handlePaste: (_view, event) => {
            const disposition = dispositionForEditorPaste(event.clipboardData);
            if (disposition === "use-default") {
              return false;
            }

            const activeEditor = editorRef.current;
            if (!activeEditor) {
              return false;
            }

            activeEditor
              .chain()
              .focus()
              .insertContent(disposition.html, {
                parseOptions: { preserveWhitespace: false },
              })
              .run();
            return true;
          },
        },
        onUpdate: ({ editor: current }) => {
          if (syncingContent.current) return;
          onUpdateRef.current(current.getJSON() as TiptapNode);
        },
        onCreate: ({ editor: created }) => {
          editorRef.current = created;
        },
        onDestroy: () => {
          editorRef.current = null;
        },
      },
      [editable],
    );

    useImperativeHandle(
      ref,
      () => ({
        getDocument: () =>
          (editor?.getJSON() as TiptapNode) ?? emptyInsightDocument(),
      }),
      [editor],
    );

    useEffect(() => {
      if (!editor) return;
      editorRef.current = editor;
    }, [editor]);

    useEffect(() => {
      if (!editor) return;
      if (
        !shouldRunEditorContentLoadEffect(
          loadedRevisionRef.current,
          contentLoadRevision,
        )
      ) {
        return;
      }

      loadedRevisionRef.current = contentLoadRevision;
      syncingContent.current = true;
      applyEditorContentLoad(editor, pendingContentRef.current, {
        preserveSelection: true,
      });
      queueMicrotask(() => {
        syncingContent.current = false;
      });
    }, [editor, contentLoadRevision]);

    useEffect(() => {
      editor?.setEditable(editable);
    }, [editor, editable]);

    useEffect(() => {
      if (!editor || !editable) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        const mod = event.metaKey || event.ctrlKey;
        if (!mod) return;

        const key = event.key.toLowerCase();
        if (key === "b") {
          event.preventDefault();
          editor.chain().focus().toggleBold().run();
          return;
        }
        if (key === "i") {
          event.preventDefault();
          editor.chain().focus().toggleItalic().run();
          return;
        }
        if (key === "k") {
          event.preventDefault();
          setLinkPopoverOpen(true);
        }
      };

      const dom = editor.view.dom;
      dom.addEventListener("keydown", handleKeyDown);
      return () => dom.removeEventListener("keydown", handleKeyDown);
    }, [editor, editable]);

    if (!editor) {
      return (
        <div className="min-h-[320px] rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-muted)]">
          Loading editor…
        </div>
      );
    }

    const activeEditor = editor as Editor;

    return (
      <div className="insight-editor rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)]">
        {editable && (
          <div className="insight-editor__toolbar flex flex-wrap gap-2 rounded-t-[var(--radius-control)] p-3">
            <ToolbarButton
              label="H2"
              active={activeEditor.isActive("heading", { level: 2 })}
              onClick={() =>
                activeEditor.chain().focus().toggleHeading({ level: 2 }).run()
              }
            />
            <ToolbarButton
              label="H3"
              active={activeEditor.isActive("heading", { level: 3 })}
              onClick={() =>
                activeEditor.chain().focus().toggleHeading({ level: 3 }).run()
              }
            />
            <ToolbarButton
              label="Bold"
              active={activeEditor.isActive("bold")}
              onClick={() => activeEditor.chain().focus().toggleBold().run()}
            />
            <ToolbarButton
              label="Italic"
              active={activeEditor.isActive("italic")}
              onClick={() => activeEditor.chain().focus().toggleItalic().run()}
            />
            <ToolbarButton
              label="• List"
              active={activeEditor.isActive("bulletList")}
              onClick={() => activeEditor.chain().focus().toggleBulletList().run()}
            />
            <ToolbarButton
              label="1. List"
              active={activeEditor.isActive("orderedList")}
              onClick={() =>
                activeEditor.chain().focus().toggleOrderedList().run()
              }
            />
            <ToolbarButton
              label="Quote"
              active={activeEditor.isActive("blockquote")}
              onClick={() => activeEditor.chain().focus().toggleBlockquote().run()}
            />
            <EditorLinkPopover
              editor={activeEditor}
              open={linkPopoverOpen}
              onOpenChange={setLinkPopoverOpen}
            />
            <ToolbarButton
              label="Undo"
              onClick={() => activeEditor.chain().focus().undo().run()}
            />
            <ToolbarButton
              label="Redo"
              onClick={() => activeEditor.chain().focus().redo().run()}
            />
          </div>
        )}

        <EditorContent
          editor={activeEditor}
          className="insight-editor__content min-h-[360px] rounded-b-[var(--radius-control)] px-4 py-4 text-[var(--color-body)] [&_.ProseMirror]:min-h-[320px] [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-[var(--color-muted)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]"
        />
      </div>
    );
  },
);

/** @internal Exposed for unit tests. */
export const __insightEditorTestHooks = {
  applyEditorContentLoad,
};
