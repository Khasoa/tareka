import HeroConcepts from "@/components/HeroConcepts";
import FollowBottle from "@/components/FollowBottle";

export default function Hero() {
  return (
    <section className="hero-surface">
      <div className="hero-canvas">
        <h1 className="sr-only">
          Discover recycling & recovery businesses in Kenya
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
            
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/materials/all.webp"
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

        
        <div className="hero-aside" aria-hidden="true">
          <p className="hero-aside__text">what is it to you?</p>
        </div>

        <FollowBottle />
      </div>
    </section>
  );
}
