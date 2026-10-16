/** Shared public-facing labels — keep cards and profiles aligned. */

export function dropoffLabel(value: string): string {
  switch (value) {
    case "yes":
      return "Public drop-off";
    case "no":
      return "No public drop-off";
    case "unknown":
      return "Drop-off unconfirmed";
    default:
      return "Drop-off unconfirmed";
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
        label: "Verified",
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

export function formatBusinessType(value: string): string {
  return value.replaceAll("_", " ");
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
