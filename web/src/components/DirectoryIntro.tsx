type Props = {
  total: number;
  countiesCount: number;
};

export default function DirectoryIntro({ total, countiesCount }: Props) {
  const businessLabel = total === 1 ? "business" : "businesses";
  const countyLabel = countiesCount === 1 ? "county" : "counties";

  return (
    <>
      <h1 className="sr-only">
        tareka — Kenya&apos;s recovery directory. Find where to take your waste.
      </h1>

      <div className="directory-intro page-shell">
        <p className="directory-intro__kicker">Kenya · Recovery directory</p>
        <p className="directory-lead">
          Discover where to take your waste — and who&apos;s turning it into
          something new.
        </p>
        {/* hidden when the API didn't answer, so we never show "0 businesses" */}
        {total > 0 && (
          <p className="directory-intro__tally">
            {total} {businessLabel} · {countiesCount} {countyLabel}
          </p>
        )}
      </div>
    </>
  );
}