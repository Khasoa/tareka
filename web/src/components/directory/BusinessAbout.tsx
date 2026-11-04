function splitDescriptionParagraphs(description: string): string[] {
  const normalized = description.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return [];
  }
  const blocks = normalized
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (blocks.length > 0) {
    return blocks;
  }
  return normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

type BusinessAboutProps = {
  description: string;
};

export function BusinessAbout({ description }: BusinessAboutProps) {
  const paragraphs = splitDescriptionParagraphs(description);
  if (paragraphs.length === 0) {
    return null;
  }

  return (
    <section className="business-detail-about" aria-label="About">
      {paragraphs.map((paragraph, index) => (
        <p key={`about-p-${index}`}>{paragraph}</p>
      ))}
    </section>
  );
}
