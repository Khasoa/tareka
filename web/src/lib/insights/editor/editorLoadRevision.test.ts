import { describe, expect, it } from "vitest";

import type { TiptapNode } from "@/lib/insights/document";
import { emptyInsightDocument } from "@/lib/insights/document";
import { shouldRunEditorContentLoadEffect } from "@/lib/insights/editor/insightEditorContentSync";

function bumpEditorLoad(
  prev: { revision: number; document: TiptapNode },
  document: TiptapNode,
) {
  return { revision: prev.revision + 1, document };
}

describe("editor load revision (article switch / reload / restore)", () => {
  it("bumps revision when switching to a different article body", () => {
    const articleA: TiptapNode = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "A" }] }],
    };
    const articleB: TiptapNode = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "B" }] }],
    };

    let load = { revision: 0, document: emptyInsightDocument() };
    load = bumpEditorLoad(load, articleA);
    expect(load.revision).toBe(1);
    expect(
      shouldRunEditorContentLoadEffect(0, load.revision),
    ).toBe(true);

    load = bumpEditorLoad(load, articleB);
    expect(load.revision).toBe(2);
    expect(load.document).toEqual(articleB);
    expect(
      shouldRunEditorContentLoadEffect(1, load.revision),
    ).toBe(true);
  });

  it("does not run content load after autosave (revision unchanged)", () => {
    expect(shouldRunEditorContentLoadEffect(3, 3)).toBe(false);
  });

  it("runs content load after reload or restore (revision bumped)", () => {
    expect(shouldRunEditorContentLoadEffect(2, 3)).toBe(true);
  });
});
