import { describe, expect, it } from "vitest";

import { getSiteOrigin } from "@/lib/siteOrigin";

describe("sitemap canonical origin", () => {
  it("defaults to the production apex domain", () => {
    expect(getSiteOrigin()).toBe("https://tareka.directory");
  });
});
