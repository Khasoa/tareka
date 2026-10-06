type HeroProps = { total: number; countiesCount: number };

export default function Hero({ total, countiesCount }: HeroProps) {
  return (
    <section className="bg-[var(--color-paper)]">
      <div className="mx-auto max-w-3xl px-6 pb-14 pt-16 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-muted)]">
          Kenya · Recovery Directory · {total} businesses · {countiesCount} {countiesCount === 1 ? "county" : "counties"}
        </p>

        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          Recycling is an{" "}
          <span className="inline-block -rotate-2 rounded-md border-[1.5px] border-[var(--color-border-strong)] bg-[var(--color-accent)] px-2 py-0.5 font-serif italic text-[var(--color-ink)] shadow-[3px_3px_0_var(--color-border-strong)]">
            art
          </span>
          .
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--color-muted)]">
          Discover where to take your waste — and who&apos;s turning it into something new.
        </p>

        <a
          href="#directory"
          className="mt-6 inline-block text-sm font-medium underline decoration-[#B9E4C4] decoration-[3px] underline-offset-4"
        >
          Explore the directory →
        </a>
      </div>
    </section>
  );
}