"use client";

import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";

import { normalizeLinkHref } from "@/lib/insights/editor/linkHref";

type EditorLinkPopoverProps = {
  editor: Editor;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function EditorLinkPopover({
  editor,
  open: openProp,
  onOpenChange,
}: EditorLinkPopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function setPopoverOpen(nextOpen: boolean) {
    if (nextOpen) {
      const previous = editor.getAttributes("link").href as string | undefined;
      setUrl(previous ?? "https://");
      setError("");
      setOpen(true);
      queueMicrotask(() => {
        inputRef.current?.focus();
      });
      return;
    }
    setOpen(false);
  }

  function applyLink() {
    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setPopoverOpen(false);
      return;
    }
    const safeHref = normalizeLinkHref(trimmed);
    if (!safeHref) {
      setError("Enter a valid web address.");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: safeHref }).run();
    setPopoverOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Link"
        title="Link (Ctrl/Cmd+K)"
        onClick={() => setPopoverOpen(!open)}
        className={`rounded-[var(--radius-control)] px-2.5 py-1.5 text-sm font-semibold transition ${
          editor.isActive("link")
            ? "bg-[var(--color-ink)] text-[var(--color-inverse)]"
            : "border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-heading)] hover:bg-[var(--color-accent-soft)]"
        }`}
      >
        Link
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-3 shadow-lg">
          <label className="block text-xs font-semibold">
            URL
            <input
              ref={inputRef}
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              className="mt-1 w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] px-2 py-1.5 text-sm font-normal"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyLink();
                }
                if (event.key === "Escape") {
                  setPopoverOpen(false);
                }
              }}
            />
          </label>
          {error && (
            <p className="mt-2 text-xs text-[var(--color-error)]">{error}</p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={applyLink}
              className="rounded-[var(--radius-control)] bg-[var(--color-ink)] px-3 py-1.5 text-xs font-semibold text-[var(--color-inverse)]"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => setPopoverOpen(false)}
              className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] px-3 py-1.5 text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
