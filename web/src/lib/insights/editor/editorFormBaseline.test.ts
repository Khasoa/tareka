import { describe, expect, it } from "vitest";

import { emptyInsightDocument } from "@/lib/insights/document";
import {
  editorStatesEqual,
  isEmptyDraftState,
  isMeaningfulRecoverySnapshot,
  recoverySnapshotDiffersFromServer,
} from "@/lib/insights/editor/editorFormBaseline";

const emptyComparable = {
  title: "",
  excerpt: "",
  slug: "",
  categoryId: null,
  publishedAt: "",
  bodyJson: emptyInsightDocument(),
  featuredImageKey: null,
  featuredImageAlt: "",
  featuredImageCaption: "",
  seoTitle: "",
  metaDescription: "",
};

describe("editorFormBaseline", () => {
  it("treats a fresh draft as empty and not dirty-worthy", () => {
    expect(isEmptyDraftState(emptyComparable)).toBe(true);
  });

  it("detects identical recovery copies as non-restorable", () => {
    const snapshot = {
      savedAt: "2026-01-01T00:00:00.000Z",
      version: 1,
      ...emptyComparable,
      publishedAt: null,
    };
    expect(recoverySnapshotDiffersFromServer(snapshot, emptyComparable)).toBe(false);
    expect(isMeaningfulRecoverySnapshot(snapshot, emptyComparable)).toBe(false);
  });

  it("detects real title edits", () => {
    const edited = { ...emptyComparable, title: "Hello" };
    expect(editorStatesEqual(emptyComparable, edited)).toBe(false);
    expect(isEmptyDraftState(edited)).toBe(false);
  });
});
