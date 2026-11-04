import { describe, expect, it } from "vitest";

import {
  authorizeRevalidationRequest,
  isAllowedRevalidationPath,
  parseRevalidationPayload,
} from "@/lib/insights/onDemandRevalidation";

describe("on-demand revalidation allow-list", () => {
  it("allows insights index, article slugs and sitemap", () => {
    expect(isAllowedRevalidationPath("/insights")).toBe(true);
    expect(isAllowedRevalidationPath("/insights/waste-hierarchy-kenya")).toBe(true);
    expect(isAllowedRevalidationPath("/sitemap.xml")).toBe(true);
  });

  it("rejects admin, preview and arbitrary paths", () => {
    expect(isAllowedRevalidationPath("/admin/insights")).toBe(false);
    expect(isAllowedRevalidationPath("/admin/insights/1/preview")).toBe(false);
    expect(isAllowedRevalidationPath("/")).toBe(false);
    expect(isAllowedRevalidationPath("/insights/evil/path")).toBe(false);
    expect(isAllowedRevalidationPath("/insights/UPPER")).toBe(false);
  });

  it("parses the Phase 2A payload shape", () => {
    const payload = parseRevalidationPayload({
      paths: ["/insights", "/insights/example-slug", "/sitemap.xml"],
      slug: "example-slug",
    });
    expect(payload?.paths).toHaveLength(3);
    expect(payload?.slug).toBe("example-slug");
  });

  it("rejects payloads with disallowed paths", () => {
    expect(
      parseRevalidationPayload({
        paths: ["/insights", "/directory/foo"],
        slug: null,
      }),
    ).toBeNull();
  });

  it("authenticates bearer secrets without exposing values", () => {
    expect(authorizeRevalidationRequest("Bearer correct", "correct")).toBe(true);
    expect(authorizeRevalidationRequest("Bearer wrong", "correct")).toBe(false);
    expect(authorizeRevalidationRequest(null, "correct")).toBe(false);
    expect(authorizeRevalidationRequest("Bearer token", "")).toBe(false);
  });
});
