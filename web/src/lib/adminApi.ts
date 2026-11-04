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

export type AdminOverview = {
  pending_verification: number;
  new_suggestions: number;
  pending_claims: number;
};

export type VerificationMaterial = {
  id: number;
  name: string;
  slug: string;
};

export type VerificationQueueItem = {
  id: number;
  name: string;
  slug: string;
  business_types: string[];
  legacy_business_type: string | null;
  types_unresolved: boolean;
  accepts_public_dropoff: string;
  offers_pickup: string;
  verification_status: string;
  last_verified_at: string | null;
  website_url: string | null;
  phone: string | null;
  source_url: string | null;
  county: string | null;
  town: string | null;
  materials: VerificationMaterial[];
};

export type VerificationQueueResponse = {
  items: VerificationQueueItem[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

export type VerificationRecordSummary = {
  id: number;
  status: string;
  verified_at: string;
  source_type: string | null;
  source_url: string | null;
  notes: string | null;
};

export type AdminBusinessDetail = VerificationQueueItem & {
  description: string | null;
  email: string | null;
  source_type: string | null;
  is_active: boolean;
  locations: {
    county: string;
    town: string | null;
    address: string | null;
  }[];
  verification_records: VerificationRecordSummary[];
};

export type VerificationAnswer =
  | "confirmed"
  | "not_confirmed"
  | "unknown";

export type VerifyBusinessPayload = {
  existence_confirmed: VerificationAnswer;
  identity_consistent: VerificationAnswer;
  location_confirmed: VerificationAnswer;
  materials_confirmed: VerificationAnswer;
  dropoff_policy_confirmed: VerificationAnswer;
  notes: string;
};

export class AdminRequestError extends Error {
  status: number;
  detail: unknown;

  constructor(message: string, status: number, detail: unknown) {
    super(message);
    this.name = "AdminRequestError";
    this.status = status;
    this.detail = detail;
  }
}

export function isAdminUnauthorizedError(error: unknown): boolean {
  return error instanceof AdminRequestError && error.status === 401;
}

export function isAdminVersionConflict(error: unknown): error is AdminRequestError {
  return (
    error instanceof AdminRequestError &&
    error.status === 409 &&
    typeof error.detail === "object" &&
    error.detail !== null &&
    "current_version" in error.detail
  );
}

import { humanizeDocumentSaveError } from "@/lib/insights/editor/documentSaveErrors";

export function formatAdminErrorDetail(detail: unknown, status: number): string {
  if (typeof detail === "string") {
    if (status === 422) {
      return humanizeDocumentSaveError(detail);
    }
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "object" && item && "msg" in item) {
          return String(item.msg);
        }
        return "Validation error";
      })
      .join(" ");
  }
  if (typeof detail === "object" && detail !== null && "message" in detail) {
    return String((detail as { message: unknown }).message);
  }
  return `Request failed (${status})`;
}

export async function adminRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { redirectOnUnauthorized = true, ...init } = options;

  const headers = new Headers(init.headers);

  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;

  if (init.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers,
  });

  if (
    response.status === 401 &&
    redirectOnUnauthorized &&
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith("/admin/login")
  ) {
    window.location.assign("/admin/login");
    throw new AdminRequestError(
      "Your session has expired. Please sign in again.",
      401,
      null,
    );
  }

  const text = await response.text();
  let data: unknown = null;

  if (text.trim()) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      try {
        data = JSON.parse(text);
      } catch {
        if (response.ok) {
          throw new AdminRequestError(
            "The server returned a response we could not read. Try again.",
            response.status,
            null,
          );
        }
      }
    }
  }

  if (!response.ok) {
    const detail =
      data && typeof data === "object" && "detail" in data
        ? data.detail
        : data;
    throw new AdminRequestError(
      formatAdminErrorDetail(detail, response.status),
      response.status,
      detail,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return data as T;
}

export function getAdminApiUrl(): string {
  return API_URL;
}