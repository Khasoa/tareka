const WORDS = ["art", "science", "balance"] as const;
const RAIL = ["balance", "art", "science", "balance", "art", "science"] as const;

export default function HeroConcepts() {
  return (
    <div className="hero-carousel" aria-hidden="true">
      <span className="hero-ellipsis">
        <i />
        <i />
        <i />
      </span>

      <div className="hero-carousel__stage">
        <span className="hero-carousel__sizer">
          {WORDS.map((word) => (
            <span key={`size-${word}`} className="hero-carousel__word">
              {word}
            </span>
          ))}
        </span>

        <div className="hero-carousel__window">
          <div className="hero-carousel__rail">
            {RAIL.map((word, index) => (
              <span key={`${word}-${index}`} className="hero-carousel__word">
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
