import Link from "@tiptap/extension-link";
import { mergeAttributes } from "@tiptap/core";

/** Stored JSON keeps href only; presentation attrs are applied at render time. */
export const InsightEditorLink = Link.extend({
  inclusive: false,

  addAttributes() {
    return {
      href: {
        default: null,
        parseHTML: (element) => element.getAttribute("href"),
        renderHTML: (attributes) => {
          if (!attributes.href) {
            return {};
          }
          return { href: attributes.href };
        },
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        class: "insight-article-link",
        rel: null,
        target: null,
      }),
      0,
    ];
  },
}).configure({
  openOnClick: false,
  autolink: false,
  linkOnPaste: false,
  HTMLAttributes: {},
});
