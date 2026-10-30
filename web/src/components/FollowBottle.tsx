"use client";

import CardLink from "@/components/CardLink";

// A bottle lying on its side, neck to the right.
const BOTTLE =
  "M10 0 H88 C112 0 118 19 140 19 H166 V45 H140 C118 45 112 64 88 64 H10 Q0 64 0 54 V10 Q0 0 10 0 Z";

export default function FollowBottle() {
  return (
    <CardLink
      href="/"
      direction="up"
      className="hero-follow"
      aria-label="Follow me to the recovery directory"
    >
      <svg
        className="follow-bottle"
        viewBox="-2 -2 276 76"
        focusable="false"
        aria-hidden="true"
      >
        <g className="follow-hover">
          <g className="follow-wobble">
            <g className="follow-fall">
              <path className="ps-fill" d={BOTTLE} />
              <path className="ps-line" d="M30 0 V64 M62 0 V64" />
              <path
                className="ps-line"
                d={BOTTLE}
                transform="translate(5 5)"
              />
              {/* the cap: pops off on impact and rolls away */}
              <rect
                className="ps-ink follow-cap"
                x="166"
                y="15"
                width="16"
                height="34"
                rx="3"
              />
            </g>
          </g>
        </g>
      </svg>

      <span className="follow-text" aria-hidden="true">
        follow me
      </span>

      <svg
        className="follow-arrow"
        viewBox="0 0 44 40"
        fill="none"
        focusable="false"
        aria-hidden="true"
      >
        <path pathLength={1} d="M6 4 C 26 2, 38 14, 30 32" />
        <path pathLength={1} d="M39 25 L30 32 L29 23" />
      </svg>
    </CardLink>
  );
}
