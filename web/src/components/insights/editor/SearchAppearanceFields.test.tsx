import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { SearchAppearanceFields } from "@/components/insights/editor/SearchAppearanceFields";

describe("SearchAppearanceFields", () => {
  it("renders collapsed optional search fields", () => {
    const html = renderToStaticMarkup(
      <SearchAppearanceFields
        seoTitle=""
        metaDescription=""
        onSeoTitleChange={() => undefined}
        onMetaDescriptionChange={() => undefined}
      />,
    );
    expect(html).toContain("Search appearance (optional)");
    expect(html).toContain("Leave blank to use the article title");
    expect(html).toContain("Leave blank to use the excerpt");
  });
});
