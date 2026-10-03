/**
 * Centralised THREADS NG brand configuration.
 *
 * Every reference to the two approved brand assets in the app funnels through
 * this module, so the source can be swapped in one place.
 *
 * To move from the bundled SVG artwork to raster exports, drop
 * `threads-ng-logo.png` / `threads-ng-bag.png` into `public/brand/` and change
 * the three paths below. Nothing else needs to change — the components read
 * these constants rather than hard-coding asset URLs.
 */

export const BRAND = {
  /** Full name, used for accessible labels and metadata. */
  name: "THREADS NG",

  /** Brand line. Single source of truth for the tagline. */
  tagline: "Everyday style. Made for you.",

  /* ---------------------------------------------------------------- *
   * Asset variants
   *
   * The approved artwork has a near-black (#0a0a0a) structure on a
   * transparent ground. That is correct on cream/bone, but on the app's
   * ink-black surfaces the black structure is the same value as the
   * background and vanishes. The `-on-dark` files are the *identical path
   * geometry* with a bone-white fill and a lightened accent, so the
   * approved mark reads clearly on dark without being redesigned.
   *
   * Rule: use the plain assets on light surfaces, the `-on-dark` assets
   * on any `bg-ink-*` surface.
   * ---------------------------------------------------------------- */

  /** Full stacked lockup, light-surface version. */
  logo: "/brand/threads-ng-logo.svg",

  /** Full stacked lockup, dark-surface version. */
  logoOnDark: "/brand/threads-ng-logo-on-dark.svg",

  /** TN monogram alone, light-surface version. */
  mark: "/brand/threads-ng-mark.svg",

  /** TN monogram alone, dark-surface version. */
  markOnDark: "/brand/threads-ng-mark-on-dark.svg",

  /** Approved shopping bag visual (order confirmation + tracking). */
  bag: "/brand/threads-ng-bag.svg",
} as const;

/** Mark + wordmark lockup, sized for the header, footer and auth screens. */
export const BRAND_LOCKUP = {
  mark: BRAND.mark,
  markOnDark: BRAND.markOnDark,
  wordmark: "THREADS",
  accent: "NG",
} as const;