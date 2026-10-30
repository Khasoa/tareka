import { CANONICAL_BUSINESS_TYPES } from "@/lib/publicLabels";

const CANONICAL_SET = new Set<string>(CANONICAL_BUSINESS_TYPES);

/** Raw `business_type` query value safe to send to the public API (empty if invalid/retired). */
export function businessTypeQueryForApi(raw: string | undefined | null): string {
  const value = (raw ?? "").trim().toLowerCase();
  if (!value || !CANONICAL_SET.has(value)) {
    return "";
  }
  return value;
}

/** Value for the business-type `<select>` (empty shows “All Business Types”). */
export function businessTypeSelectValue(raw: string | undefined | null): string {
  return businessTypeQueryForApi(raw);
}
