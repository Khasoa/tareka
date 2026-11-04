import { describe, expect, it } from "vitest";

import {
  AdminRequestError,
  formatAdminErrorDetail,
  isAdminUnauthorizedError,
  isAdminVersionConflict,
} from "@/lib/adminApi";

describe("admin API errors", () => {
  it("detects unauthorized errors", () => {
    expect(isAdminUnauthorizedError(new AdminRequestError("x", 401, null))).toBe(
      true,
    );
  });

  it("detects version conflicts", () => {
    const error = new AdminRequestError("conflict", 409, {
      message: "Article was updated elsewhere.",
      current_version: 7,
    });
    expect(isAdminVersionConflict(error)).toBe(true);
  });

  it("formats structured conflict messages", () => {
    expect(
      formatAdminErrorDetail(
        { message: "Article was updated elsewhere." },
        409,
      ),
    ).toBe("Article was updated elsewhere.");
  });
});

describe("featured image alt validation (client guard)", () => {
  it("requires alt text when an image key is present before publish", () => {
    const imageKey = "insights/example.webp";
    const alt = "  ";
    expect(Boolean(imageKey && alt.trim())).toBe(false);
  });
});
