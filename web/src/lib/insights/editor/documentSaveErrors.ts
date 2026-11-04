/** Map API document validation messages to editor-friendly copy. */
export function humanizeDocumentSaveError(detail: string): string {
  const trimmed = detail.trim();
  if (!trimmed) {
    return "We could not save the article body. Check links and formatting, then try again.";
  }

  const lower = trimmed.toLowerCase();
  if (lower.includes("article body is required")) {
    return "Add article text before publishing.";
  }
  if (lower.includes("title is required to publish")) {
    return "Add a title before publishing.";
  }
  if (lower.includes("slug is required to publish")) {
    return "Add a slug before publishing.";
  }
  if (lower.includes("category is required to publish")) {
    return "Choose a category before publishing.";
  }
  if (lower.includes("excerpt is required to publish")) {
    return "Add an excerpt before publishing.";
  }
  if (lower.includes("publication date is required")) {
    return "Set a publication date before publishing.";
  }
  if (lower.includes("cannot replace article body with empty")) {
    return "The article body cannot be empty. Add some text or reload the server version.";
  }
  if (lower.includes("javascript:") || lower.includes("data:")) {
    return "One link uses an unsupported address. Use http, https, or mailto only.";
  }
  if (lower.includes("links must use")) {
    return "One link uses an unsupported address. Use http, https, or mailto only.";
  }
  if (lower.includes("link") && lower.includes("href")) {
    return "One link is not valid. Use a full http, https, or mailto address.";
  }
  if (lower.includes("link mark")) {
    return "We could not save a link in the article. Try removing and re-adding it.";
  }
  if (
    lower.startsWith("unsupported") ||
    lower.startsWith("document") ||
    lower.startsWith("mark ") ||
    lower.startsWith("link ") ||
    lower.startsWith("heading") ||
    lower.startsWith("text node")
  ) {
    return "We could not save the article body. Check links and formatting, then try again.";
  }

  return trimmed;
}
