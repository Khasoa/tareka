"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  className?: string;
};

export default function HeroDirectorySearch({ className = "" }: Props) {
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

  function scrollResultsIntoView() {
    if (pathname !== "/") return;
    const list = document.getElementById("directory");
    if (!list || list.getBoundingClientRect().top <= window.innerHeight * 0.6) {
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const next = String(formData.get("q") ?? value);
    setValue(next);
    commitQuery(next);
    scrollResultsIntoView();
  }

  const clearParams = new URLSearchParams(searchParams.toString());
  clearParams.delete("q");
  const clearHref = clearParams.toString()
    ? `${pathname}?${clearParams.toString()}`
    : pathname;

  return (
    <form
      onSubmit={handleSubmit}
      className={`directory-search ${className}`.trim()}
      role="search"
    >
      <label htmlFor="hero-directory-search" className="sr-only">
        Search the recovery directory
      </label>

      <div className="directory-search__field">
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
          placeholder="Search the recovery directory"
          autoComplete="off"
          className="min-h-11 min-w-0 w-full flex-1 bg-transparent px-4 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)]"
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
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center px-3 text-xl font-normal leading-none text-[var(--color-muted)] no-underline hover:text-[var(--color-ink)]"
          >
            ×
          </Link>
        ) : null}

        <button type="submit" className="directory-search__submit">
          Search
        </button>
      </div>
    </form>
  );
}
