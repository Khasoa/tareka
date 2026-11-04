import type { Editor } from "@tiptap/core";

import type { TiptapNode } from "@/lib/insights/document";
import { insightDocumentsEqual } from "@/lib/insights/editor/insightDocumentsEqual";

/** True when InsightEditor should run applyEditorContentLoad (revision bumped). */
export function shouldRunEditorContentLoadEffect(
  loadedRevision: number,
  contentLoadRevision: number,
): boolean {
  return loadedRevision !== contentLoadRevision;
}

export function shouldApplyEditorContentLoad(
  editor: Editor,
  incoming: TiptapNode,
): boolean {
  const current = editor.getJSON() as TiptapNode;
  return !insightDocumentsEqual(current, incoming);
}

export function applyEditorContentLoad(
  editor: Editor,
  incoming: TiptapNode,
  options?: { preserveSelection?: boolean },
): boolean {
  if (!shouldApplyEditorContentLoad(editor, incoming)) {
    return false;
  }

  const preserveSelection = options?.preserveSelection ?? true;
  const selection = preserveSelection ? editor.state.selection : null;
  const from = selection?.from ?? 0;
  const to = selection?.to ?? 0;

  editor.commands.setContent(incoming, { emitUpdate: false });

  if (preserveSelection && selection) {
    const docSize = editor.state.doc.content.size;
    const safeFrom = Math.min(from, docSize);
    const safeTo = Math.min(to, docSize);
    editor.commands.setTextSelection({ from: safeFrom, to: safeTo });
  }

  return true;
}
