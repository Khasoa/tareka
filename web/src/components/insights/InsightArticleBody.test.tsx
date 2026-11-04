import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { InsightArticleBody } from "@/components/insights/InsightArticleBody";

describe("InsightArticleBody", () => {
  it("renders allowed document nodes without raw HTML injection", () => {
    const html = renderToStaticMarkup(
      <InsightArticleBody
        bodyJson={{
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Hello world" }],
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Section" }],
            },
          ],
        }}
      />,
    );

    expect(html).toContain("Hello world");
    expect(html).toContain("<h2>");
    expect(html).not.toContain("dangerouslySetInnerHTML");
  });

  it("does not render unsafe link protocols", () => {
    const html = renderToStaticMarkup(
      <InsightArticleBody
        bodyJson={{
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Click me",
                  marks: [
                    {
                      type: "link",
                      attrs: { href: "javascript:alert(1)" },
                    },
                  ],
                },
              ],
            },
          ],
        }}
      />,
    );

    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<a ");
    expect(html).toContain("Click me");
  });

  it("renders safe https links", () => {
    const html = renderToStaticMarkup(
      <InsightArticleBody
        bodyJson={{
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Safe",
                  marks: [
                    {
                      type: "link",
                      attrs: { href: "https://example.org/path" },
                    },
                  ],
                },
              ],
            },
          ],
        }}
      />,
    );

    expect(html).toContain('href="https://example.org/path"');
    expect(html).toContain('class="insight-article-link"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("renders bullet and ordered lists with list items", () => {
    const html = renderToStaticMarkup(
      <InsightArticleBody
        bodyJson={{
          type: "doc",
          content: [
            {
              type: "bulletList",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "One" }],
                    },
                  ],
                },
              ],
            },
            {
              type: "orderedList",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "Bold item",
                          marks: [{ type: "bold" }],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        }}
      />,
    );

    expect(html).toContain("<ul>");
    expect(html).toContain("<ol>");
    expect(html).toContain("<li>");
    expect(html).toContain("<strong>Bold item</strong>");
  });
});
