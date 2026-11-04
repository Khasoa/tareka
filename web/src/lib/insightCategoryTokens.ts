/** Maps CMS category names to insight category colours (CSS variables in globals.css). */

/** Switch to `'outlined'` to restore bordered pills on cards and article headers. */
export const INSIGHT_CATEGORY_LABEL_VARIANT: "filled" | "outlined" = "filled";

export const INSIGHT_CATEGORY_COLOR_VARS = {
  foundations: "--color-insight-foundations",
  recovery: "--color-insight-recovery",
  material: "--color-insight-material",
} as const;

const CATEGORY_TO_TOKEN_KEY: Record<string, keyof typeof INSIGHT_CATEGORY_COLOR_VARS> = {
  Foundations: "foundations",
  "Recovery in Practice": "recovery",
  "Material Explorations": "material",
};

export function insightCategoryColor(category: string): string {
  const key = CATEGORY_TO_TOKEN_KEY[category];
  if (!key) {
    return "var(--color-accent)";
  }
  return `var(${INSIGHT_CATEGORY_COLOR_VARS[key]})`;
}

/** @deprecated Use insightCategoryColor — kept for sidebar dots. */
export const insightCategoryDotColor = insightCategoryColor;
