/** Shared public-facing labels — keep cards and profiles aligned. */

export const CANONICAL_BUSINESS_TYPES = [
  "collector",
  "aggregator",
  "recycler",
  "upcycler",
] as const;

export type CanonicalBusinessType = (typeof CANONICAL_BUSINESS_TYPES)[number];

const BUSINESS_TYPE_LABELS: Record<CanonicalBusinessType, string> = {
  collector: "Collector",
  aggregator: "Aggregator",
  recycler: "Recycler",
  upcycler: "Upcycler",
};

const TYPE_ORDER: Record<CanonicalBusinessType, number> = {
  collector: 0,
  aggregator: 1,
  recycler: 2,
  upcycler: 3,
};

export function sortBusinessTypes(types: string[]): string[] {
  const unique = [...new Set(types.map((item) => item.trim().toLowerCase()))];
  return unique.sort(
    (left, right) =>
      (TYPE_ORDER[left as CanonicalBusinessType] ?? 99) -
      (TYPE_ORDER[right as CanonicalBusinessType] ?? 99),
  );
}

export function businessTypeLabel(value: string): string {
  const key = value.trim().toLowerCase() as CanonicalBusinessType;
  return BUSINESS_TYPE_LABELS[key] ?? value.replaceAll("_", " ");
}

export function formatBusinessTypesLine(types: string[] | undefined): string {
  if (!types?.length) return "";
  return sortBusinessTypes(types)
    .map((item) => businessTypeLabel(item))
    .join(" · ");
}

/** @deprecated Use formatBusinessTypesLine with business_types[] */
export function formatBusinessType(value: string): string {
  return businessTypeLabel(value);
}

export function serviceAvailabilityPublicDetail(
  value: string,
): { label: string; showGreenDot: boolean } {
  switch (value.trim().toLowerCase()) {
    case "yes":
      return { label: "Yes", showGreenDot: true };
    case "no":
      return { label: "No", showGreenDot: false };
    default:
      return { label: "Not confirmed", showGreenDot: false };
  }
}

/** Admin-only tri-state labels for drop-off / pick-up controls. */
export function adminServiceAvailabilityLabel(value: string): string {
  switch (value.trim().toLowerCase()) {
    case "yes":
      return "Yes";
    case "no":
      return "No";
    default:
      return "Unknown";
  }
}

export type VerificationDisplay = {
  status: string;
  label: string;
  showMark: boolean;
  tone: "verified" | "review" | "unverified";
};

export function verificationDisplay(status: string): VerificationDisplay {
  switch (status) {
    case "verified":
      return {
        status,
        label: "Active",
        showMark: true,
        tone: "verified",
      };
    case "needs_review":
      return {
        status,
        label: "Under review",
        showMark: false,
        tone: "review",
      };
    case "unverified":
      return {
        status,
        label: "Not yet verified",
        showMark: false,
        tone: "unverified",
      };
    default:
      return {
        status,
        label: status.replaceAll("_", " "),
        showMark: false,
        tone: "unverified",
      };
  }
}

export function formatLastChecked(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatLocation(
  town: string | null | undefined,
  county: string | null | undefined,
): string {
  if (town && county) {
    if (town.trim().toLocaleLowerCase() === county.trim().toLocaleLowerCase()) {
      return town.trim();
    }
    return `${town}, ${county}`;
  }
  return county || town || "";
}
