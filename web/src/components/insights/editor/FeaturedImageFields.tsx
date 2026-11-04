"use client";

import { useRef, useState } from "react";

import {
  uploadInsightFeaturedImage,
  type FeaturedImageUploadResponse,
} from "@/lib/adminInsightsApi";

type FeaturedImageFieldsProps = {
  imageUrl: string | null;
  imageKey: string | null;
  altText: string;
  caption: string;
  onAltChange: (value: string) => void;
  onCaptionChange: (value: string) => void;
  onUploaded: (payload: FeaturedImageUploadResponse) => void;
  onRemove: () => void;
  disabled?: boolean;
};

export function FeaturedImageFields({
  imageUrl,
  imageKey,
  altText,
  caption,
  onAltChange,
  onCaptionChange,
  onUploaded,
  onRemove,
  disabled,
}: FeaturedImageFieldsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const uploaded = await uploadInsightFeaturedImage(file, {
        redirectOnUnauthorized: false,
      });
      onUploaded(uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-5">
      <h2 className="text-lg font-semibold">Featured image</h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        One image for the article header. Alt text is required before publishing when an image is set.
      </p>

      {imageUrl && (
        <figure className="mt-4 max-w-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={altText || "Featured image preview"}
            className="aspect-[16/9] w-full object-cover"
          />
        </figure>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-paper)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--color-accent-soft)] disabled:opacity-50"
        >
          {uploading ? "Uploading…" : imageKey ? "Replace image" : "Upload image"}
        </button>
        {imageKey && (
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={onRemove}
            className="rounded-[var(--radius-control)] border border-[var(--color-border-strong)] px-4 py-2 text-sm font-semibold text-[var(--color-heading)] transition hover:bg-[var(--color-accent-soft)] disabled:opacity-50"
          >
            Remove image
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <label className="mt-4 block text-sm font-semibold">
        Alt text
        <input
          value={altText}
          disabled={disabled}
          onChange={(event) => onAltChange(event.target.value)}
          className="mt-1 w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-paper)] px-3 py-2 text-sm font-normal"
          placeholder="Describe the image for screen readers"
        />
      </label>

      <label className="mt-3 block text-sm font-semibold">
        Caption <span className="font-normal text-[var(--color-muted)]">(optional)</span>
        <input
          value={caption}
          disabled={disabled}
          onChange={(event) => onCaptionChange(event.target.value)}
          className="mt-1 w-full rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-paper)] px-3 py-2 text-sm font-normal"
        />
      </label>

      {error && (
        <p role="alert" className="mt-3 text-sm text-[var(--color-error)]">
          {error}
        </p>
      )}
    </section>
  );
}
