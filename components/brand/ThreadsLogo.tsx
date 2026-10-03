/**
 * THREADS NG logo.
 *
 * Renders the approved TN monogram from `public/brand/`.
 *
 * Two details matter for correctness here:
 *
 * 1. SURFACE VARIANT. The approved artwork has a near-black (#0a0a0a) structure,
 *    so on the app's ink-black surfaces it renders as black-on-black and
 *    disappears. `onDark` swaps in the `-on-dark` asset, which is the identical
 *    path geometry with a bone-white fill. The mark is never redesigned, never
 *    replaced, and never dropped.
 *
 * 2. LIVE TYPE, NOT SVG `<text>`. Fonts referenced inside an SVG loaded through
 *    `<img>` are not available to the browser, so a wordmark drawn as SVG text
 *    silently falls back to a generic sans and loses the brand weight. Every
 *    wordmark in the app is therefore real HTML text, which applies the brand
 *    font, scales properly, and stays selectable and translatable.
 */

import Image from "next/image";
import { BRAND } from "@/lib/brand";

type LogoVariant = "mark" | "compact" | "lockup";

interface ThreadsLogoProps {
  /**
   * - `mark`    — the TN monogram on its own. Use at very small sizes.
   * - `compact` — monogram + wordmark, side by side. Header / footer.
   * - `lockup`  — full stacked lockup with tagline. Splash / auth screens.
   */
  variant?: LogoVariant;
  /** Tailwind sizing classes applied to the outermost element. */
  className?: string;
  /** Rendered monogram height in px; type scales proportionally from it. */
  height?: number;
  /** Skip lazy loading for above-the-fold placements (LCP). */
  priority?: boolean;
  /** Overrides the default accessible name. */
  alt?: string;
  /**
   * Set when placed on a dark (`bg-ink-*`) surface, so the near-black variant
   * of the approved artwork is used instead of the invisible-on-dark one.
   */
  onDark?: boolean;
}

/** Intrinsic aspect ratio of the monogram artwork (620 x 250). */
const MARK_RATIO = 620 / 250;

export function ThreadsLogo({
  variant = "compact",
  className = "",
  height = 34,
  priority = false,
  alt,
  onDark = false,
}: ThreadsLogoProps) {
  const src = onDark ? BRAND.markOnDark : BRAND.mark;
  const markWidth = Math.round(height * MARK_RATIO);

  /* ---------------------------------------------------------------- *
   * `mark` — the monogram alone.
   * ---------------------------------------------------------------- */
  if (variant === "mark") {
    return (
      <Image
        src={src}
        alt={alt ?? `${BRAND.name} logo`}
        width={markWidth}
        height={height}
        priority={priority}
        unoptimized
        className={className}
      />
    );
  }

  /* ---------------------------------------------------------------- *
   * `lockup` — monogram, wordmark and tagline, stacked and centred.
   * Used on the splash and auth screens, where the brand needs presence.
   * ---------------------------------------------------------------- */
  if (variant === "lockup") {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <Image
          src={src}
          alt={alt ?? `${BRAND.name} TN monogram`}
          width={markWidth}
          height={height}
          priority={priority}
          unoptimized
          className="h-auto"
        />

        <span
          className="mt-[0.42em] font-sans font-bold uppercase leading-none tracking-[0.14em] text-bone-50"
          style={{ fontSize: Math.round(height * 0.4) }}
        >
          THREADS<span className="text-accent-400">NG</span>
        </span>

        <span
          className="mt-[0.9em] font-sans font-medium uppercase leading-none tracking-[0.3em] text-ink-300"
          style={{ fontSize: Math.max(9, Math.round(height * 0.115)) }}
        >
          {BRAND.tagline}
        </span>
      </div>
    );
  }

  /* ---------------------------------------------------------------- *
   * `compact` — monogram + wordmark, side by side. Header and footer.
   * ---------------------------------------------------------------- */
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src={src}
        alt=""
        aria-hidden
        width={Math.round(height * MARK_RATIO * 0.72)}
        height={height}
        priority={priority}
        unoptimized
        className="shrink-0"
      />
      <span
        className="font-sans font-bold uppercase leading-none tracking-[0.16em] text-bone-50"
        style={{ fontSize: Math.max(12, Math.round(height * 0.42)) }}
      >
        THREADS<span className="text-accent-400">NG</span>
      </span>
    </span>
  );
}