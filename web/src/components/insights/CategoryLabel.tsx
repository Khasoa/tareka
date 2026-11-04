import {
  INSIGHT_CATEGORY_LABEL_VARIANT,
  insightCategoryColor,
} from "@/lib/insightCategoryTokens";

type CategoryLabelProps = {
  category: string;
};

/** Category pill for insight cards and article headers (not the sidebar list). */
export function CategoryLabel({ category }: CategoryLabelProps) {
  const label = category.trim();
  if (!label) {
    return null;
  }

  const color = insightCategoryColor(label);
  const filled = INSIGHT_CATEGORY_LABEL_VARIANT === "filled";

  return (
    <span
      className={
        filled ? "category-label category-label--filled" : "category-label"
      }
      style={
        filled
          ? { backgroundColor: color }
          : { borderColor: color }
      }
    >
      {label}
    </span>
  );
}
