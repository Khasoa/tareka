"use client";

type SearchAppearanceFieldsProps = {
  seoTitle: string;
  metaDescription: string;
  onSeoTitleChange: (value: string) => void;
  onMetaDescriptionChange: (value: string) => void;
};

function CharacterGuide({ value, guide }: { value: string; guide: number }) {
  const length = value.length;
  const tone =
    length === 0
      ? "text-[var(--color-muted)]"
      : length <= guide
        ? "text-[var(--color-muted)]"
        : "text-[var(--color-danger)]";

  return (
    <p className={`mt-1 text-xs ${tone}`}>
      {length} characters · aim for about {guide}
    </p>
  );
}

export function SearchAppearanceFields({
  seoTitle,
  metaDescription,
  onSeoTitleChange,
  onMetaDescriptionChange,
}: SearchAppearanceFieldsProps) {
  return (
    <details className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3">
      <summary className="cursor-pointer text-sm font-semibold text-[var(--color-heading)]">
        Search appearance (optional)
      </summary>

      <div className="mt-4 grid gap-4">
        <label className="block text-sm font-semibold">
          Search title
          <input
            value={seoTitle}
            onChange={(event) => onSeoTitleChange(event.target.value)}
            className="mt-1 w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-paper)] px-3 py-2 text-sm font-normal"
          />
          <p className="mt-1 text-xs font-normal text-[var(--color-muted)]">
            Leave blank to use the article title
          </p>
          <CharacterGuide value={seoTitle} guide={60} />
        </label>

        <label className="block text-sm font-semibold">
          Search description
          <textarea
            value={metaDescription}
            rows={3}
            onChange={(event) => onMetaDescriptionChange(event.target.value)}
            className="mt-1 w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-paper)] px-3 py-2 text-sm font-normal"
          />
          <p className="mt-1 text-xs font-normal text-[var(--color-muted)]">
            Leave blank to use the excerpt
          </p>
          <CharacterGuide value={metaDescription} guide={155} />
        </label>
      </div>
    </details>
  );
}
