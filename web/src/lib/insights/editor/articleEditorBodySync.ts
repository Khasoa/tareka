import type { TiptapNode } from "@/lib/insights/document";
import {
  noteUserBodyEdit,
  type BodySaveSessionState,
} from "@/lib/insights/editor/bodySaveGuard";

/** Copy the live editor document into form state before save/publish. */
export function applyLatestEditorBodyToForm<T extends { bodyJson: TiptapNode }>(
  form: T,
  session: BodySaveSessionState,
  latestBody: TiptapNode,
): T {
  noteUserBodyEdit(session, latestBody);
  return { ...form, bodyJson: latestBody };
}
