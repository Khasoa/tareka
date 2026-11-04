import { describe, expect, it } from "vitest";

import { normalizeTitleSegment, pageMetadata } from "@/lib/metadata";

describe("normalizeTitleSegment", () => {
  it("strips a trailing site suffix before template application", () => {
    expect(normalizeTitleSegment("Waste hierarchy | tareka")).toBe("Waste hierarchy");
    expect(normalizeTitleSegment("Already clean")).toBe("Already clean");
  });
});

describe("pageMetadata", () => {
  it("stores one title segment so the root template adds | tareka once", () => {
    const meta = pageMetadata({
      title: "The Waste Hierarchy | tareka",
      description: "Example",
      path: "/insights/example",
    });
    expect(meta.title).toBe("The Waste Hierarchy");
  });
});
