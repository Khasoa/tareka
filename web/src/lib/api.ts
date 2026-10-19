const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

const FETCH_TIMEOUT_MS = 8_000;

async function fetchApi(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export type Location = {
  id: number;
  county: string;
  town: string | null;
};

export type Material = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
};

export type Business = {
  id: number;
  name: string;
  slug: string;
  business_type: string;
  accepts_public_dropoff: string;
  verification_status: string;
  last_verified_at: string | null;
  locations: Location[];
  /** Present on list and detail responses. Older payloads may omit it. */
  materials?: Material[];
};

export type BusinessDetail = Business & {
  description: string | null;
  website_url: string | null;
  phone: string | null;
  email: string | null;
  image_url: string | null;
  image_alt: string | null;
  created_at: string;
  updated_at: string;
};

export type BusinessListResponse = {
  items: Business[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

export async function getBusinesses(
  params: URLSearchParams,
): Promise<BusinessListResponse> {
  const response = await fetchApi(`/businesses?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch businesses");
  }

  return response.json();
}

export async function getBusiness(
  slug: string,
): Promise<BusinessDetail> {
  const response = await fetchApi(`/businesses/${slug}`);

  if (!response.ok) {
    throw new Error("Business not found");
  }

  return response.json();
}

export async function getCounties(): Promise<string[]> {
  const response = await fetchApi(`/directory/counties`);

  if (!response.ok) {
    throw new Error("Failed to fetch counties");
  }

  return response.json();
}

export async function getMaterials(): Promise<
  {
    id: number;
    name: string;
    slug: string;
    parent_id: number | null;
  }[]
> {
  const response = await fetchApi(`/directory/materials`);

  if (!response.ok) {
    throw new Error("Failed to fetch materials");
  }

  return response.json();
}

export type SuggestionPayload = {
  name: string;
  county: string;
  description_raw?: string | null;
  materials_raw?: string | null;
  source_url: string;
  phone?: string | null;
  submitter_note?: string | null;
  submitter_email?: string | null;
  honeypot?: string;
};

export type ClaimPayload = {
  claimant_name: string;
  claimant_role: string;
  claimant_contact: string;
  correction_note?: string | null;
  content_use_consent: boolean;
  image_consent: boolean;
  honeypot?: string;
};

async function getErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => null);

    if (
      data &&
      typeof data === "object" &&
      "detail" in data &&
      typeof data.detail === "string"
    ) {
      return data.detail;
    }
  }

  return fallback;
}

export async function createSuggestion(
  data: SuggestionPayload,
): Promise<{ status: string }> {
  const response = await fetchApi(`/api/suggestions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Failed to submit suggestion.",
      ),
    );
  }

  return response.json();
}

export async function createClaim(
  businessId: number,
  data: ClaimPayload,
): Promise<{ status: string }> {
  const response = await fetchApi(
    `/api/businesses/${businessId}/claims`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Failed to submit claim.",
      ),
    );
  }

  return response.json();
}