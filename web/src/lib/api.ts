const API_URL = "http://localhost:8000";

export type Location = {
  id: number;
  county: string;
  town: string | null;
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
};

export type BusinessDetail = Business & {
  description: string | null;
  website_url: string | null;
  phone: string | null;
  email: string | null;
  materials: { id: number; name: string; slug: string; parent_id: number | null }[];
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

export async function getBusinesses(params: URLSearchParams): Promise<BusinessListResponse> {
  const response = await fetch(`${API_URL}/businesses?${params.toString()}`);
  if (!response.ok) throw new Error("Failed to fetch businesses");
  return response.json();
}

export async function getBusiness(slug: string): Promise<BusinessDetail> {
  const response = await fetch(`${API_URL}/businesses/${slug}`);
  if (!response.ok) throw new Error("Business not found");
  return response.json();
}

export async function getCounties(): Promise<string[]> {
  const response = await fetch(`${API_URL}/directory/counties`);
  if (!response.ok) throw new Error("Failed to fetch counties");
  return response.json();
}

export async function getMaterials(): Promise<{ id: number; name: string; slug: string; parent_id: number | null }[]> {
  const response = await fetch(`${API_URL}/directory/materials`);
  if (!response.ok) throw new Error("Failed to fetch materials");
  return response.json();
}