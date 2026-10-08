const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

type RequestOptions = RequestInit & {
  redirectOnUnauthorized?: boolean;
};

export type Suggestion = {
  id: number;
  name: string;
  county: string;
  description_raw: string | null;
  materials_raw: string | null;
  source_url: string;
  phone: string | null;
  submitter_note: string | null;
  submitter_email: string | null;
  status: string;
  created_at: string;
};

export type MaterialOption = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
};

export type Claim = {
  id: number;
  business_id: number;
  business_name: string;
  business_slug: string;
  claimant_name: string;
  claimant_role: string;
  claimant_contact: string;
  correction_note: string | null;
  content_use_consent: boolean;
  image_consent: boolean;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
};

export async function adminRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    redirectOnUnauthorized = true,
    ...init
  } = options;

  const headers = new Headers(init.headers);

  if (
    init.body &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...init,
      credentials: "include",
      cache: "no-store",
      headers,
    },
  );

  if (
    response.status === 401 &&
    redirectOnUnauthorized &&
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith(
      "/admin/login",
    )
  ) {
    window.location.assign("/admin/login");

    throw new Error(
      "Your session has expired. Please sign in again.",
    );
  }

  const contentType =
    response.headers.get("content-type") ?? "";

  const data = contentType.includes(
    "application/json",
  )
    ? await response.json()
    : null;

  if (!response.ok) {
    const detail =
      data &&
      typeof data === "object" &&
      "detail" in data &&
      typeof data.detail === "string"
        ? data.detail
        : `Request failed (${response.status})`;

    throw new Error(detail);
  }

  return data as T;
}