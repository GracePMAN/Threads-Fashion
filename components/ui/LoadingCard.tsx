"use client";

import { useEffect, useState } from "react";
import { CATEGORIES, categoryTheme } from "@/lib/catalog";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

/**
 * The THREADS NG loading card — one component, two scales.
 *
 *   variant="splash"  → the large, full-screen initial-load card
 *   variant="action"  → the compact card shown while a real async operation runs
 *
 * Both render the SAME visual system: a rounded card on a dark premium surface
 * with a subtle border and lime accent, containing a small THREADS NG product
 * visual that cycles through the real category list (T-Shirt, Hoodie, Sneaker,
 * Cap, Bag) plus a concise loading message and a progress treatment.
 *
 * The only difference between the variants is scale. Nothing is duplicated, so
 * the two can never drift apart visually.
 *
 * It is deliberately NOT a spinner: the cycling product visual is the loading
 * affordance, with a thin progress rule beneath it.
 */

export type LoadingCardVariant = "splash" | "action";

interface LoadingCardProps {
  variant: LoadingCardVariant;
  /** Short, human message, e.g. "Adding to cart…". */
  message?: string;
  /** `splash` is always announced; `action` announces only when it appears. */
  announce?: boolean;
}

/** Cadence for the cycling product visual. */
const SWAP_MS = 900;

/** Singular name per category. */
const CATEGORY_NOUNS: Record<string, string> = {
  "T-Shirts": "T-Shirt",
  Hoodies: "Hoodie",
  Trousers: "Trouser",
  Sneakers: "Sneaker",
  Caps: "Cap",
  Bags: "Bag",
};

/**
 * The small product silhouette. Same artwork in both variants; only the size
 * changes, which is what keeps the two cards visually related.
 */
function ProductGlyph({ category, ink }: { category: string; ink: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="presentation"
      className="shrink-0 drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)]"
    >
      <g
        fill="none"
        stroke={ink}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.92"
      >
        {category === "T-Shirts" && (
          <>
            <path d="M24 16 14 21 9 31l7 4 4-7v22h24V28l4 7 7-4-5-10-10-5a9 9 0 0 1-16 0Z" />
            <path d="M24 16a9 9 0 0 0 16 0" />
          </>
        )}
        {category === "Hoodies" && (
          <>
            <path d="M24 16 14 21 9 31l7 4 4-7v22h24V28l4 7 7-4-5-10-10-5" />
            <path d="M24 16a8 8 0 0 0 16 0" />
            <path d="M28 16h8v6a4 4 0 0 1-8 0Z" />
            <path d="M24 42h16v7H24z" />
          </>
        )}
        {category === "Trousers" && (
          <>
            <path d="M22 14h20l-2 36h-7l-1-22-1 22h-7Z" />
            <path d="M22 20h20" />
          </>
        )}
        {category === "Sneakers" && (
          <>
            <path d="M12 42c0-7 4-11 11-12l7-1 5-8 6 6 6 2c5 2 9 6 9 13v4H12Z" />
            <path d="M12 46h44" />
            <path d="M30 29l4 5" />
          </>
        )}
        {category === "Caps" && (
          <>
            <path d="M13 41a19 19 0 0 1 38 0Z" />
            <path d="M13 41h38c0 5-4 7-11 7H24c-7 0-11-2-11-7Z" />
            <path d="M32 22v19" />
          </>
        )}
        {category === "Bags" && (
          <>
            <path d="M17 23h30v27a3 3 0 0 1-3 3H20a3 3 0 0 1-3-3Z" />
            <path d="M26 23v-5a6 6 0 0 1 12 0v5" />
            <path d="M32 32v11" />
          </>
        )}
      </g>
    </svg>
  );
}
/**
 * The shared loading card.
 *
 * Only the inner product visual changes over time — the outer card is fixed, so
 * the card never jumps or resizes while it is on screen.
 */
export function LoadingCard({
  variant,
  message,
  announce = false,
}: LoadingCardProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);

  // Cycle the product visual. Suppressed entirely under reduced motion, so the
  // card shows a single static product instead of animating.
  useEffect(() => {
    if (reducedMotion) return;

    const timer = window.setInterval(
      () => setIndex((i) => (i + 1) % CATEGORIES.length),
      SWAP_MS,
    );
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  const category = CATEGORIES[index];
  const noun = CATEGORY_NOUNS[category] ?? category;
  const isSplash = variant === "splash";

  return (
    <div
      role="status"
      aria-live={announce ? "polite" : "off"}
      className={
        isSplash
          ? "w-full overflow-hidden rounded-3xl border border-ink-800 bg-ink-900/85 p-3 shadow-[0_24px_70px_-20px_rgba(0,0,0,0.9)] ring-1 ring-bone-50/5"
          : "w-full max-w-[15rem] overflow-hidden rounded-2xl border border-ink-700 bg-ink-900/95 p-2.5 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.95)] ring-1 ring-bone-50/5"
      }
    >
      <div
        className={`relative overflow-hidden bg-ink-900 ${
          isSplash ? "aspect-[4/3] rounded-2xl" : "aspect-square rounded-xl"
        }`}
      >
        {/* All visuals stay mounted and cross-fade, so the card is never empty. */}
        {CATEGORIES.map((c, i) => {
          const t = categoryTheme(c);
          return (
            <div
              key={c}
              aria-hidden={i !== index}
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ease-out ${
                i === index ? "opacity-100" : "opacity-0"
              }`}
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `linear-gradient(150deg, ${t.from} 0%, ${t.to} 100%)`,
                }}
              />
              {/* Hairline grid, for an editorial feel rather than a flat blob. */}
              <span
                aria-hidden
                className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 20px), repeating-linear-gradient(90deg, #fff 0 1px, transparent 1px 20px)",
                }}
              />
              {/* Same artwork both variants; the action card is simply smaller. */}
              <div className={isSplash ? "scale-100" : "scale-[0.6]"}>
                <ProductGlyph category={c} ink={t.ink} />
              </div>
              <span
                className={`absolute font-semibold uppercase tracking-[0.3em] ${
                  isSplash ? "bottom-4 text-[0.6rem]" : "bottom-2.5 text-[0.5rem]"
                }`}
                style={{ color: t.ink }}
              >
                {CATEGORY_NOUNS[c] ?? c}
              </span>
            </div>
          );
        })}

        {/* Soft sweep — reads as "loading" without a generic spinner. */}
        {!reducedMotion && (
          <span
            aria-hidden
            className={`pointer-events-none absolute inset-y-0 bg-linear-to-r from-transparent via-white/12 to-transparent motion-safe:animate-[threads-shimmer_2.6s_ease-in-out_infinite] ${
              isSplash ? "w-20" : "w-12"
            }`}
          />
        )}

        {/* Progress ticks. */}
        <span
          aria-hidden
          className={`absolute flex gap-1.5 ${
            isSplash ? "bottom-4 left-4" : "bottom-2.5 left-2.5"
          }`}
        >
          {CATEGORIES.map((c, i) => (
            <span
              key={c}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === index ? "w-5 bg-bone-50" : "w-1.5 bg-bone-50/25"
              }`}
            />
          ))}
        </span>
      </div>

      {/* Footer: the message plus the position in the cycle. */}
      <div
        className={`flex items-center justify-between gap-3 ${
          isSplash ? "px-2.5 pb-1 pt-3.5" : "px-1.5 pb-0.5 pt-2"
        }`}
      >
        <p
          className={`truncate font-semibold uppercase tracking-[0.2em] text-bone-100 ${
            isSplash ? "text-[0.7rem]" : "text-[0.6rem]"
          }`}
        >
          {message ?? category}
        </p>
        <p
          className={`shrink-0 font-mono tabular-nums text-ink-400 ${
            isSplash ? "text-[0.65rem]" : "text-[0.55rem]"
          }`}
        >
          {String(index + 1).padStart(2, "0")}
          <span className="text-ink-600">/</span>
          {String(CATEGORIES.length).padStart(2, "0")}
        </p>
      </div>

      {/* Slim progress rule beneath the card. */}
      <div
        aria-hidden
        className={`overflow-hidden rounded-full bg-ink-800 ${
          isSplash ? "mt-2 h-[3px]" : "mt-1.5 h-[2px]"
        }`}
      >
        <span
          className={`block rounded-full bg-accent-400 ${
            reducedMotion
              ? "w-full opacity-40"
              : "w-[45%] motion-safe:animate-[threads-progress_1.6s_ease-out_infinite]"
          }`}
        />
      </div>

      <p className="sr-only">
        {noun} — {message ?? "loading"}
      </p>
    </div>
  );
}

export default LoadingCard;

