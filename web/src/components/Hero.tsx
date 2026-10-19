import { Suspense } from "react";
import HeroDirectorySearch from "@/components/HeroDirectorySearch";

type HeroProps = { total: number; countiesCount: number };

export default function Hero({ total, countiesCount }: HeroProps) {
  return (
    <section className="hero-surface relative overflow-hidden">
      <div className="relative mx-auto max-w-5xl px-6 pb-8 pt-8 text-center sm:pb-10 sm:pt-10">
        <p className="hero-enter text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--color-muted)] sm:text-xs">
          Kenya · Recovery Directory · {total} businesses · {countiesCount}{" "}
          {countiesCount === 1 ? "county" : "counties"}
        </p>

        <h1 className="hero-enter hero-enter-delay-1 mt-6 sm:mt-7">
          <span className="sr-only">
            Recycling is art and science — discover verified recovery businesses
            in Kenya
          </span>

          <span
            aria-hidden="true"
            className="hero-recycling-title block text-[var(--color-ink)]"
          >
            Recycling is
          </span>

          {/*
            Exhibition lockup: ghost “art” is the mass; ink “science” is a
            smaller handwritten annotation across its optical centre.
          */}
          <span
            aria-hidden="true"
            className="relative -mt-4 block w-full select-none overflow-visible leading-none sm:-mt-5"
          >
            <span className="font-art mx-auto block w-fit text-[clamp(5.5rem,28vw,13rem)] font-normal leading-[0.78] tracking-[-0.02em] text-[var(--color-ink)]/[0.16]">
              art
            </span>
            <span
              className="hero-science pointer-events-none absolute left-1/2 top-[62%] whitespace-nowrap font-script text-[clamp(1.1rem,5.4vw,2.65rem)] font-normal leading-none tracking-[-0.03em] text-[var(--color-ink)]"
              style={{
                transform: "translate(calc(-50% - 0.10em), -50%) rotate(-8deg)",
              }}
            >
              science
            </span>
          </span>
        </h1>

        <p className="hero-enter hero-enter-delay-2 mx-auto mt-5 max-w-lg text-base leading-relaxed text-[var(--color-muted)] sm:mt-6 sm:max-w-xl sm:text-lg sm:leading-relaxed">
          Discover where to take your waste — and who&apos;s turning it into
          something new.
        </p>

        <div className="hero-enter hero-enter-delay-3">
          <Suspense
            fallback={
              <div
                className="mx-auto mt-5 h-11 max-w-xl rounded-[var(--radius-search)] bg-[var(--color-ink)] sm:mt-6 sm:h-12"
                aria-hidden="true"
              />
            }
          >
            <HeroDirectorySearch />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
