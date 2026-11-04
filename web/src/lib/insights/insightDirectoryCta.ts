export const DEFAULT_INSIGHT_DIRECTORY_CTA_LABEL = "Find a recovery business";
export const DEFAULT_INSIGHT_DIRECTORY_CTA_HREF = "/#directory";

export type InsightDirectoryCtaFields = {
  directoryMaterialSlug?: string | null;
  directoryMaterialName?: string | null;
  directoryCtaLabel?: string | null;
};

export type InsightDirectoryCta = {
  href: string;
  label: string;
};

/** Article footer CTA: generic directory link unless the view model specifies a material. */
export function resolveInsightDirectoryCta(
  article: InsightDirectoryCtaFields,
): InsightDirectoryCta {
  const slug = article.directoryMaterialSlug?.trim();
  if (slug) {
    const query = new URLSearchParams({ material: slug }).toString();
    const materialName =
      article.directoryMaterialName?.trim() || slug.replace(/-/g, " ");
    return {
      href: `/?${query}`,
      label:
        article.directoryCtaLabel?.trim() ||
        `Find businesses that accept ${materialName}`,
    };
  }

  return {
    href: DEFAULT_INSIGHT_DIRECTORY_CTA_HREF,
    label: DEFAULT_INSIGHT_DIRECTORY_CTA_LABEL,
  };
}
