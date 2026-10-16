"use client";

import { useState } from "react";

type MaterialCard = {
  slug: string;
  label: string;
  number: string;
  image: string;
  description: string;
};

const MATERIALS: MaterialCard[] = [
  {
    slug: "",
    label: "All materials",
    number: "00",
    image: "/images/materials/all.png",
    description: "Every material currently in the directory",
  },
  {
    slug: "glass",
    label: "Glass",
    number: "01",
    image: "/images/materials/glass.png",
    description: "Bottles, jars and broken glass",
  },
  {
    slug: "plastic",
    label: "Plastic",
    number: "02",
    image: "/images/materials/plastic.png",
    description: "Bottles, packaging and other plastics",
  },
  {
    slug: "organic-waste",
    label: "Organic",
    number: "03",
    image: "/images/materials/organic.png",
    description: "Food scraps, garden waste and organics",
  },
  {
    slug: "textiles",
    label: "Textiles",
    number: "04",
    image: "/images/materials/textiles.png",
    description: "Clothing, fabric and other fibres",
  },
  {
    slug: "paper",
    label: "Paper",
    number: "05",
    image: "/images/materials/paper.png",
    description: "Paper, card and cardboard packaging",
  },
  {
    slug: "metal",
    label: "Metal",
    number: "06",
    image: "/images/materials/metal.png",
    description: "Cans, scrap and other metals",
  },
  {
    slug: "e-waste",
    label: "E-waste",
    number: "07",
    image: "/images/materials/e-waste.png",
    description: "Phones, appliances and electronics",
  },
];

type Props = {
  selectedSlug: string;
  onSelectMaterial: (slug: string) => void;
};

export default function MaterialsExhibition({
  selectedSlug,
  onSelectMaterial,
}: Props) {
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [focusedSlug, setFocusedSlug] = useState<string | null>(null);

  const activeSlug = hoveredSlug ?? focusedSlug ?? selectedSlug;

  return (
    <section
      aria-labelledby="materials-heading"
      className="overflow-hidden bg-[var(--color-paper)] py-8 sm:py-10"
    >
      <div className="mx-auto max-w-[var(--content-max-width)] px-5 sm:px-8 lg:px-12">
        <div className="mb-5 sm:mb-6">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-muted)] sm:text-xs">
            Find a new destination
          </p>

          <h2 id="materials-heading" className="section-heading">
            What are we reworking?
          </h2>

          <p className="mt-1.5 text-xs text-[var(--color-muted)] sm:text-sm">
            Choose a material to explore where it can go.
          </p>
        </div>

        <div
          className="relative"
          onPointerLeave={(event) => {
            if (event.pointerType === "mouse") setHoveredSlug(null);
          }}
        >
          <div className="flex snap-x snap-mandatory items-stretch gap-2 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2.5">
            {MATERIALS.map((material) => {
              const isActive = activeSlug === material.slug;
              const isSelected = selectedSlug === material.slug;

              return (
                <button
                  key={material.slug || "all"}
                  type="button"
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") {
                      setHoveredSlug(material.slug);
                    }
                  }}
                  onFocus={() => setFocusedSlug(material.slug)}
                  onBlur={() => setFocusedSlug(null)}
                  onClick={() => onSelectMaterial(material.slug)}
                  aria-pressed={isSelected}
                  aria-label={`Filter directory by ${material.label}`}
                  className={[
                    "group relative isolate flex h-[210px] shrink-0 snap-start flex-col overflow-hidden",
                    "rounded-[var(--radius-media)] bg-[var(--color-paper)] text-left",
                    "transition-[flex-basis,width,min-width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ink)]",
                    "sm:h-[270px] lg:h-[285px]",
                    isActive
                      ? "w-[58vw] min-w-[11.5rem] shrink-0 sm:w-[24%] sm:min-w-[13rem] lg:w-[18%] lg:min-w-[11.5rem]"
                      : "w-[30vw] min-w-[6.25rem] sm:min-w-[6.5rem] lg:w-auto lg:min-w-0 lg:flex-1",
                    isSelected
                      ? "ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-paper)]"
                      : "ring-1 ring-[var(--color-border)]",
                  ].join(" ")}
                >
                  <span className="relative min-h-0 flex-1 overflow-hidden bg-[var(--color-ink)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={material.image}
                      alt=""
                      loading="lazy"
                      className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 ${
                        isActive ? "scale-100" : "scale-110"
                      }`}
                    />

                    <span className="absolute left-3 top-3 text-[10px] font-medium tracking-[0.15em] text-[var(--color-inverse)] [text-shadow:0_1px_2px_rgba(0,0,0,0.55)] sm:left-4 sm:top-4">
                      {material.number}
                    </span>

                    {isSelected && (
                      <span className="absolute right-3 top-3 rounded-full border border-[var(--color-inverse)]/80 bg-[var(--color-ink)]/55 px-2 py-1 text-[9px] font-medium uppercase tracking-wider text-[var(--color-inverse)] sm:right-4 sm:top-4">
                        Selected
                      </span>
                    )}
                  </span>

                  <span
                    className={[
                      "relative z-10 flex shrink-0 flex-col justify-center border-t border-[var(--color-border)] bg-[var(--color-paper)] text-[var(--color-ink)]",
                      isActive
                        ? "min-h-[4.75rem] px-3 py-2.5 sm:min-h-[5.25rem] sm:px-4 sm:py-3"
                        : "min-h-[2.35rem] px-2 py-1.5 sm:min-h-[2.5rem] sm:px-3",
                    ].join(" ")}
                  >
                    {isActive ? (
                      <>
                        <span className="mb-1.5 block h-[3px] w-7 bg-[var(--color-accent)] sm:w-9" />
                        <span className="font-display text-base font-semibold leading-tight tracking-tight sm:text-xl">
                          {material.label}
                        </span>
                        <span className="mt-0.5 line-clamp-1 text-[10px] text-[var(--color-muted)] sm:text-xs">
                          {material.description}
                        </span>
                      </>
                    ) : (
                      <span className="truncate text-[11px] font-medium sm:text-sm">
                        {material.label}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)] sm:text-xs">
            Browse by material
          </p>
          <p className="text-[10px] text-[var(--color-muted)] lg:hidden">
            Swipe to explore →
          </p>
        </div>
      </div>
    </section>
  );
}
