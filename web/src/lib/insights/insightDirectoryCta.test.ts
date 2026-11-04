import { describe, expect, it } from "vitest";

import {
  DEFAULT_INSIGHT_DIRECTORY_CTA_HREF,
  DEFAULT_INSIGHT_DIRECTORY_CTA_LABEL,
  resolveInsightDirectoryCta,
} from "@/lib/insights/insightDirectoryCta";

describe("resolveInsightDirectoryCta", () => {
  it("uses a generic directory link by default", () => {
    expect(resolveInsightDirectoryCta({})).toEqual({
      href: DEFAULT_INSIGHT_DIRECTORY_CTA_HREF,
      label: DEFAULT_INSIGHT_DIRECTORY_CTA_LABEL,
    });
  });

  it("uses material filter when the view model specifies a slug", () => {
    expect(
      resolveInsightDirectoryCta({
        directoryMaterialSlug: "plastic",
        directoryMaterialName: "plastic",
      }),
    ).toEqual({
      href: "/?material=plastic",
      label: "Find businesses that accept plastic",
    });
  });

  it("respects an explicit CTA label override", () => {
    expect(
      resolveInsightDirectoryCta({
        directoryMaterialSlug: "glass",
        directoryMaterialName: "glass",
        directoryCtaLabel: "Find glass recyclers",
      }),
    ).toEqual({
      href: "/?material=glass",
      label: "Find glass recyclers",
    });
  });
});
