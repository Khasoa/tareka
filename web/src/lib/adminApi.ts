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