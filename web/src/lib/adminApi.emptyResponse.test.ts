import { describe, expect, it, vi } from "vitest";

import { adminRequest } from "@/lib/adminApi";

describe("adminRequest empty responses", () => {
  it("returns undefined for 204 responses without parsing JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 204,
      ok: true,
      headers: {
        get: (name: string) =>
          name === "content-type" ? "application/json" : null,
      },
      text: async () => "",
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await adminRequest<void>("/api/admin/insights/1", {
      method: "DELETE",
      redirectOnUnauthorized: false,
    });

    expect(result).toBeUndefined();
    vi.unstubAllGlobals();
  });
});
