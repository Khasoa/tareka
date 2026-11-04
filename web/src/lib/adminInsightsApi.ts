import {
  adminRequest,
  AdminRequestError,
  formatAdminErrorDetail,
  getAdminApiUrl,
} from "@/lib/adminApi";

export type InsightCategory = {
  id: number;
  slug: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export type InsightArticleStatus = "draft" | "published";

export type InsightArticleSummary = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  status: InsightArticleStatus;
  category_id: number | null;
  category_name: string | null;
  published_at: string | null;
  version: number;
  updated_at: string;
  featured_image_key: string | null;
  featured_image_alt: string | null;
};

export type InsightArticleDetail = InsightArticleSummary & {
  body_json: Record<string, unknown>;
  featured_image_caption: string | null;
  seo_title: string | null;
  meta_description: string | null;
  featured_image_url: string | null;
  created_at: string;
  save_notices?: string[];
};

export type InsightArticleListResponse = {
  items: InsightArticleSummary[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

export type FeaturedImageUploadResponse = {
  storage_key: string;
  public_url: string;
  width: number;
  height: number;
  content_type: string;
};

export type ArticleUpdatePayload = {
  version: number;
  slug?: string;
  title?: string;
  excerpt?: string;
  category_id?: number | null;
  body_json?: Record<string, unknown>;
  allow_empty_body?: boolean;
  published_at?: string | null;
  featured_image_key?: string | null;
  featured_image_alt?: string | null;
  featured_image_caption?: string | null;
  seo_title?: string | null;
  meta_description?: string | null;
};

export async function listInsightCategories(): Promise<InsightCategory[]> {
  return adminRequest<InsightCategory[]>("/api/admin/insights/categories");
}

export async function listInsightArticles(params: {
  page?: number;
  page_size?: number;
  status?: InsightArticleStatus;
  category_id?: number;
}): Promise<InsightArticleListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.page_size) query.set("page_size", String(params.page_size));
  if (params.status) query.set("status", params.status);
  if (params.category_id) query.set("category_id", String(params.category_id));
  const qs = query.toString();
  return adminRequest<InsightArticleListResponse>(
    `/api/admin/insights${qs ? `?${qs}` : ""}`,
  );
}

export async function createInsightArticle(payload: {
  title?: string;
  slug?: string;
  category_id?: number | null;
}): Promise<InsightArticleDetail> {
  return adminRequest<InsightArticleDetail>("/api/admin/insights", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getInsightArticle(
  articleId: number,
  options?: { redirectOnUnauthorized?: boolean },
): Promise<InsightArticleDetail> {
  return adminRequest<InsightArticleDetail>(
    `/api/admin/insights/${articleId}`,
    options,
  );
}

export async function updateInsightArticle(
  articleId: number,
  payload: ArticleUpdatePayload,
  options?: { redirectOnUnauthorized?: boolean },
): Promise<InsightArticleDetail> {
  return adminRequest<InsightArticleDetail>(
    `/api/admin/insights/${articleId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
      ...options,
    },
  );
}

export async function publishInsightArticle(
  articleId: number,
  payload: { version: number; published_at?: string | null },
): Promise<InsightArticleDetail> {
  return adminRequest<InsightArticleDetail>(
    `/api/admin/insights/${articleId}/publish`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function unpublishInsightArticle(
  articleId: number,
  payload: { version: number },
): Promise<InsightArticleDetail> {
  return adminRequest<InsightArticleDetail>(
    `/api/admin/insights/${articleId}/unpublish`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function deleteInsightArticle(articleId: number): Promise<void> {
  await adminRequest<void>(`/api/admin/insights/${articleId}`, {
    method: "DELETE",
  });
}

export async function uploadInsightFeaturedImage(
  file: File,
  options?: { redirectOnUnauthorized?: boolean },
): Promise<FeaturedImageUploadResponse> {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(
    `${getAdminApiUrl()}/api/admin/insights/featured-image/upload`,
    {
      method: "POST",
      credentials: "include",
      body: form,
    },
  );

  const text = await response.text();
  let data: unknown = null;

  if (text.trim()) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      try {
        data = JSON.parse(text);
      } catch {
        throw new AdminRequestError(
          "The image upload response could not be read. Try again.",
          response.status,
          null,
        );
      }
    }
  }

  if (response.status === 401) {
    if (options?.redirectOnUnauthorized !== false) {
      window.location.assign("/admin/login");
    }
    throw new AdminRequestError(
      "Your session has expired. Please sign in again.",
      401,
      null,
    );
  }

  if (!response.ok) {
    const detail =
      data && typeof data === "object" && "detail" in data ? data.detail : data;
    throw new AdminRequestError(
      formatAdminErrorDetail(detail, response.status),
      response.status,
      detail,
    );
  }

  return data as FeaturedImageUploadResponse;
}

export async function checkAdminSession(): Promise<boolean> {
  try {
    await adminRequest<{ email: string }>("/api/admin/me", {
      redirectOnUnauthorized: false,
    });
    return true;
  } catch {
    return false;
  }
}
