
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function HeroDirectorySearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qFromUrl = searchParams.get("q") ?? "";
  const [value, setValue] = useState(qFromUrl);
  const [trackedUrlQ, setTrackedUrlQ] = useState(qFromUrl);

  if (trackedUrlQ !== qFromUrl) {
    setTrackedUrlQ(qFromUrl);
    setValue(qFromUrl);
  }

  function commitQuery(raw: string) {
    const next = raw.trim();
    const params = new URLSearchParams(searchParams.toString());

    if (next) {
      params.set("q", next);
    } else {
      params.delete("q");
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    commitQuery(value);
  }

  const clearParams = new URLSearchParams(searchParams.toString());
  clearParams.delete("q");
  const clearHref = clearParams.toString()
    ? `${pathname}?${clearParams.toString()}`
    : pathname;

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-5 w-full max-w-xl sm:mt-6"
      role="search"
    >
      <label htmlFor="hero-directory-search" className="sr-only">
        Search the recovery directory
      </label>

      <div className="flex items-stretch overflow-hidden rounded-[var(--radius-search)] border border-[var(--color-ink)] bg-[var(--color-ink)] shadow-[inset_3px_0_0_0_var(--color-accent)] focus-within:shadow-[inset_3px_0_0_0_var(--color-accent),0_0_0_2px_var(--color-accent)]">
        <input
          id="hero-directory-search"
          type="search"
          name="q"
          value={value}
          onChange={(event) => {
            const next = event.currentTarget.value;
            setValue(next);
            if (next.trim() === "") {
              commitQuery("");
            }
          }}
          placeholder="Search the directory…"
          autoComplete="off"
          className="min-h-11 min-w-0 w-full flex-1 bg-transparent px-4 text-sm text-[var(--color-inverse)] outline-none placeholder:text-[var(--color-inverse)]/45 sm:min-h-12 sm:px-6 sm:text-base"
        />

        {value ? (
          <Link
            href={clearHref}
            scroll={false}
            aria-label="Clear search"
            onClick={(event) => {
              event.preventDefault();
              setValue("");
              commitQuery("");
            }}
            className="search-clear flex min-h-11 min-w-11 shrink-0 items-center justify-center px-3 text-2xl font-normal leading-none no-underline sm:min-h-12"
          >
            ×
          </Link>
        ) : null}

        <button
          type="submit"
          className="shrink-0 bg-[var(--color-accent)] px-4 text-sm font-medium text-[var(--color-ink)] transition-colors hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-ink)] sm:px-6 sm:text-base"
        >
          Search
        </button>
      </div>
    </form>
  );
}
