import HeroConcepts from "@/components/HeroConcepts";
import FollowBottle from "@/components/FollowBottle";

export default function Hero() {
  return (
    <section className="hero-surface">
      <div className="hero-canvas">
        <h1 className="sr-only">
          Recycling is art, science and balance — discover verified recovery
          businesses in Kenya
        </h1>

        <div className="hero-stack" aria-hidden="true">
          <p className="hero-phrase">
            <span className="hero-phrase__lead">Recycling</span>
            <span className="hero-phrase__aux"> is</span>
          </p>
          <HeroConcepts />

          <div className="hero-collage">
            <div className="hero-collage__rings" />
            <div className="hero-collage__photo">
              {/* swap src for a real photo of someone in your directory */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/materials/all.png"
                alt=""
                width={353}
                height={475}
                decoding="async"
              />
            </div>
            <div className="hero-collage__disc" />
            <div className="hero-collage__ring" />
            <span className="hero-collage__line" />
            <span className="hero-collage__label hero-collage__label--top">
              Kenya
            </span>
            <span className="hero-collage__label hero-collage__label--bottom">
              1°N 38°E
            </span>
          </div>
        </div>

        {/* the short arrow, reversed: it now points TO the question */}
        <div className="hero-aside" aria-hidden="true">
          <svg
            className="hero-aside__arrow"
            viewBox="0 0 120 150"
            fill="none"
            focusable="false"
          >
            <path pathLength={1} d="M18 46 C 74 66, 100 96, 96 146" />
            <path pathLength={1} d="M109 126 L96 146 L88 128" />
          </svg>
          <p className="hero-aside__text">what is it to you?</p>
        </div>

        <FollowBottle />
      </div>
    </section>
  );
}