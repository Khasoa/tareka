import { describe, expect, it } from "vitest";

import {
  saveButtonLabel,
  shouldAutosaveArticle,
} from "@/lib/insights/editor/autosavePolicy";

describe("published article autosave policy", () => {
  it("autosaves drafts only", () => {
    expect(shouldAutosaveArticle("draft")).toBe(true);
    expect(shouldAutosaveArticle("published")).toBe(false);
  });

  it("uses distinct save labels", () => {
    expect(saveButtonLabel("draft")).toBe("Save draft");
    expect(saveButtonLabel("published")).toBe("Save changes");
  });
});
