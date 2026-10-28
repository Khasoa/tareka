"use client";

import { useRef, useState, type CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type MaterialCard = {
  slug: string;
  label: string;
  image: string;
  description: string;
};

const MATERIALS: MaterialCard[] = [
  { slug: "", label: "All materials", image: "/images/materials/all.png", description: "Every material currently in the directory" },
  { slug: "glass", label: "Glass", image: "/images/materials/glass.png", description: "Bottles, jars and broken glass" },
  { slug: "plastic", label: "Plastic", image: "/images/materials/plastic.png", description: "Bottles, packaging and other plastics" },
  { slug: "organic-waste", label: "Organic", image: "/images/materials/organic.png", description: "Food scraps, garden waste and organics" },
  { slug: "textiles", label: "Textiles", image: "/images/materials/textiles.png", description: "Clothing, fabric and other fibres" },
  { slug: "paper", label: "Paper", image: "/images/materials/paper.png", description: "Paper, card and cardboard packaging" },
  { slug: "metal", label: "Metal", image: "/images/materials/metal.png", description: "Cans, scrap and other metals" },
  { slug: "e-waste", label: "E-waste", image: "/images/materials/e-waste.png", description: "Phones, appliances and electronics" },
];

const COUNT = MATERIALS.length;
const HALF = COUNT / 2;

// Circular offset from the selected card: -4 … 3. Offset -4 is the hidden one.
function offsetOf(index: number, selected: number) {
  return ((index - selected + HALF + COUNT) % COUNT) - HALF;
}

type Props = {
  materials: { id: number; slug: string }[];
};

export default function MaterialsExhibition({ materials }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const touchX = useRef<number | null>(null);

  const slugParam = (searchParams.get("material") ?? "").trim();
  const idParam = searchParams.get("material_id");
  const selectedSlug =
    slugParam ||
    materials.find((m) => String(m.id) === idParam)?.slug ||
    "";
  const selectedIndex = Math.max(
    0,
    MATERIALS.findIndex((m) => m.slug === selectedSlug),
  );
  const selected = MATERIALS[selectedIndex];

  const offsets = MATERIALS.map((_, i) => offsetOf(i, selectedIndex));

  // A card that wraps from one side to the other should teleport (while
  // invisible) instead of flying across the screen.
  const [track, setTrack] = useState({
    sel: selectedIndex,
    offsets,
    jumped: offsets.map(() => false),
  });
  if (track.sel !== selectedIndex) {
    setTrack({
      sel: selectedIndex,
      offsets,
      jumped: offsets.map((o, i) => Math.abs(o - track.offsets[i]) > HALF),
    });
  }

  function select(index: number) {
    const wrapped = (index + COUNT) % COUNT;
    const target = MATERIALS[wrapped];
    if (!target || wrapped === selectedIndex) return;

    const params = new URLSearchParams(searchParams.toString());
    if (target.slug) params.set("material", target.slug);
    else params.delete("material");
    params.delete("material_id");

    const next = params.toString();
    router.replace(next ? `/?${next}` : "/", { scroll: false });
  }

  function scrollToResults(delay: number) {
    window.setTimeout(() => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.getElementById("directory")?.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      });
    }, delay);
  }

  function handleCardClick(index: number) {
    const isCurrent = index === selectedIndex;
    select(index);
    scrollToResults(isCurrent ? 0 : 650);
  }

  return (
    <section aria-labelledby="materials-heading" className="materials">
      <h2 id="materials-heading" className="sr-only">
        What are we reworking? Choose a material.
      </h2>

      {/* the arrows flank the row, level with the selected card */}
      <div className="materials__stage">
        <button
          type="button"
          className="materials__step materials__step--prev"
          aria-label="Previous material"
          onClick={() => select(selectedIndex - 1)}
        >
          ←
        </button>

        <div
          className="materials__viewport"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") select(selectedIndex + 1);
            if (e.key === "ArrowLeft") select(selectedIndex - 1);
          }}
          onTouchStart={(e) => {
            touchX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const delta = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(delta) < 50) return;
            select(delta < 0 ? selectedIndex + 1 : selectedIndex - 1);
          }}
        >
          {MATERIALS.map((material, index) => {
            const offset = offsets[index];
            const isSelected = offset === 0;
            const isHidden = Math.abs(offset) === HALF;

            return (
              <button
                key={material.slug || "all"}
                type="button"
                onClick={() => handleCardClick(index)}
                aria-pressed={isSelected}
                aria-label={`Filter directory by ${material.label}`}
                aria-hidden={isHidden || undefined}
                tabIndex={isHidden ? -1 : 0}
                data-a={Math.abs(offset)}
                style={
                  {
                    "--dir": Math.sign(offset),
                    "--a": Math.abs(offset),
                  } as CSSProperties
                }
                className={[
                  "material-card",
                  isSelected ? "is-selected" : "",
                  isHidden ? "is-hidden" : "",
                  track.jumped[index] ? "is-jump" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="material-card__image">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={material.image}
                    alt=""
                    width={353}
                    height={475}
                    decoding="async"
                  />
                </span>
                <span className="material-card__caption">
                  <span className="material-card__name">{material.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="materials__step materials__step--next"
          aria-label="Next material"
          onClick={() => select(selectedIndex + 1)}
        >
          →
        </button>
      </div>

      <p className="materials__meta" aria-live="polite">
        {selected.description}
      </p>

      <button
        type="button"
        className="materials__cue"
        onClick={() => scrollToResults(0)}
      >
        Browse the directory ↓
      </button>
    </section>
  );
}