interface StarsProps {
  value: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

const SIZES = {
  sm: { star: 12, text: "text-[0.7rem]" },
  md: { star: 15, text: "text-xs" },
  lg: { star: 20, text: "text-sm" },
} as const;

/**
 * Read-only star rating display. Renders full/half/empty stars from a 0-5
 * average plus the review count, e.g. "4.5 (12)".
 */
export function Stars({ value, count, size = "md", showValue = true, className = "" }: StarsProps) {
  const clamped = Math.max(0, Math.min(5, value));
  const { star, text } = SIZES[size];

  return (
    <div className={`flex items-center gap-1.5 ${text} ${className}`}>
      <div
        className="flex items-center gap-0.5"
        role="img"
        aria-label={
          count
            ? `Rated ${clamped.toFixed(1)} out of 5 from ${count} reviews`
            : `Rated ${clamped.toFixed(1)} out of 5`
        }
      >
        {[1, 2, 3, 4, 5].map((position) => {
          const filled = clamped >= position;
          const half = !filled && clamped >= position - 0.5;
          return (
            <svg
              key={position}
              width={star}
              height={star}
              viewBox="0 0 20 20"
              aria-hidden
              className="shrink-0"
            >
              <defs>
                <linearGradient id={`half-${position}-${size}`}>
                  <stop offset="50%" stopColor="#b4e63c" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
              <path
                d="M10 1.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L10 14.9l-5.25 2.75 1-5.85L1.5 7.65l5.9-.85z"
                fill={filled ? "#b4e63c" : half ? `url(#half-${position}-${size})` : "#3a3a38"}
                stroke={filled || half ? "#b4e63c" : "#4a4a47"}
                strokeWidth="0.5"
              />
            </svg>
          );
        })}
      </div>

      {showValue && (
        <span className="text-ink-300">
          {clamped > 0 ? clamped.toFixed(1) : "—"}
          {typeof count === "number" && (
            <span className="text-ink-500"> ({count})</span>
          )}
        </span>
      )}
    </div>
  );
}

interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

/** Interactive 1-5 star picker used in the review form. */
export function StarInput({ value, onChange, disabled }: RatingInputProps) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((position) => {
        const active = position <= value;
        return (
          <button
            key={position}
            type="button"
            role="radio"
            aria-checked={value === position}
            aria-label={`${position} star${position > 1 ? "s" : ""}`}
            disabled={disabled}
            onClick={() => onChange(position)}
            className="rounded p-0.5 transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg width={28} height={28} viewBox="0 0 20 20" aria-hidden>
              <path
                d="M10 1.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L10 14.9l-5.25 2.75 1-5.85L1.5 7.65l5.9-.85z"
                fill={active ? "#b4e63c" : "#3a3a38"}
                stroke={active ? "#b4e63c" : "#4a4a47"}
                strokeWidth="0.5"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
