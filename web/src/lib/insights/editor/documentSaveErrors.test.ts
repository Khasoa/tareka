import { describe, expect, it } from "vitest";

import { formatAdminErrorDetail } from "@/lib/adminApi";
import { humanizeDocumentSaveError } from "@/lib/insights/editor/documentSaveErrors";

describe("humanizeDocumentSaveError", () => {
  it("maps link mark validator text to plain English", () => {
    expect(humanizeDocumentSaveError("Link mark attrs are invalid.")).toBe(
      "We could not save a link in the article. Try removing and re-adding it.",
    );
  });

  it("maps unsafe protocol messages", () => {
    expect(humanizeDocumentSaveError("Links must use http, https or mailto.")).toBe(
      "One link uses an unsupported address. Use http, https, or mailto only.",
    );
  });

  it("maps publish body requirement to plain English", () => {
    expect(
      humanizeDocumentSaveError("Article body is required to publish."),
    ).toBe("Add article text before publishing.");
  });
});

describe("formatAdminErrorDetail", () => {
  it("does not surface raw document validator strings on 422", () => {
    expect(
      formatAdminErrorDetail("Link mark attrs are invalid.", 422),
    ).not.toContain("Link mark attrs are invalid.");
  });
});
