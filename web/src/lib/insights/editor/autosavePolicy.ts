export function shouldAutosaveArticle(status: "draft" | "published"): boolean {
  return status === "draft";
}

export function saveButtonLabel(status: "draft" | "published"): string {
  return status === "published" ? "Save changes" : "Save draft";
}
