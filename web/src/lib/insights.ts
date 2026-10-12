import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const INSIGHTS_DIR = path.join(process.cwd(), "content", "insights");

export type InsightFrontmatter = {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  cover_image?: string;
  image_alt?: string;
  published_at: string;
};

export type InsightSummary = InsightFrontmatter;

export type InsightArticle = {
  frontmatter: InsightFrontmatter;
  content: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(
  data: Record<string, unknown>,
  field: string,
  fileName: string,
): string {
  const value = data[field];

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(
      `Invalid insight "${fileName}": "${field}" must be a non-empty string.`,
    );
  }

  return value.trim();
}

function parseFrontmatter(
  data: unknown,
  fileName: string,
): InsightFrontmatter {
  if (!isRecord(data)) {
    throw new Error(`Invalid insight "${fileName}": frontmatter must be an object.`);
  }

  const title = requiredString(data, "title", fileName);
  const slug = requiredString(data, "slug", fileName);
  const excerpt = requiredString(data, "excerpt", fileName);
  const category = requiredString(data, "category", fileName);
  const publishedAt = requiredString(data, "published_at", fileName);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(
      `Invalid insight "${fileName}": slug must use lowercase letters, numbers and hyphens.`,
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedAt)) {
    throw new Error(
      `Invalid insight "${fileName}": published_at must use YYYY-MM-DD.`,
    );
  }

  const parsedDate = new Date(`${publishedAt}T00:00:00.000Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== publishedAt
  ) {
    throw new Error(
      `Invalid insight "${fileName}": published_at is not a valid calendar date.`,
    );
  }

  const coverImage = data.cover_image;
  const imageAlt = data.image_alt;

  if (coverImage !== undefined && typeof coverImage !== "string") {
    throw new Error(
      `Invalid insight "${fileName}": cover_image must be a string.`,
    );
  }

  if (imageAlt !== undefined && typeof imageAlt !== "string") {
    throw new Error(
      `Invalid insight "${fileName}": image_alt must be a string.`,
    );
  }

  if (coverImage && !coverImage.startsWith("/images/insights/")) {
    throw new Error(
      `Invalid insight "${fileName}": cover_image must use /images/insights/.`,
    );
  }

  if (coverImage && !imageAlt?.trim()) {
    throw new Error(
      `Invalid insight "${fileName}": add meaningful image_alt text for the cover image.`,
    );
  }

  return {
    title,
    slug,
    excerpt,
    category,
    published_at: publishedAt,
    ...(coverImage ? { cover_image: coverImage } : {}),
    ...(imageAlt !== undefined ? { image_alt: imageAlt.trim() } : {}),
  };
}

function readInsightFile(fileName: string): InsightArticle {
  const raw = fs.readFileSync(path.join(INSIGHTS_DIR, fileName), "utf8");
  const { data, content } = matter(raw);
  const frontmatter = parseFrontmatter(data, fileName);
  const expectedSlug = fileName.replace(/\.mdx$/, "");

  if (frontmatter.slug !== expectedSlug) {
    throw new Error(
      `Invalid insight "${fileName}": slug must match its filename ("${expectedSlug}").`,
    );
  }

  return { frontmatter, content };
}

export function getAllInsights(): InsightSummary[] {
  if (!fs.existsSync(INSIGHTS_DIR)) {
    return [];
  }

  const files = fs
    .readdirSync(INSIGHTS_DIR)
    .filter((fileName) => fileName.endsWith(".mdx"))
    .sort();

  const insights = files.map((fileName) => {
    return readInsightFile(fileName).frontmatter;
  });

  return insights.sort(
    (a, b) =>
      Date.parse(`${b.published_at}T00:00:00Z`) -
      Date.parse(`${a.published_at}T00:00:00Z`),
  );
}

export function getInsightBySlug(slug: string): InsightArticle | null {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return null;
  }

  const filePath = path.join(INSIGHTS_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return readInsightFile(`${slug}.mdx`);
}