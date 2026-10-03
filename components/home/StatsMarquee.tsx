/**
 * Homepage stats marquee.
 *
 * A continuous horizontal ticker of the three catalogue stats.
 *
 * WHY THIS IS ACTUALLY SEAMLESS
 * -----------------------------
 * The classic way to build a marquee is to render the content twice and
 * animate the track from `0` to `-50%`. That is only seamless when the track is
 * exactly twice one copy's width. With short content (three stats is ~600px) and
 * two copies, the track is ~1200px — so on any viewport wider than that the
 * right-hand side of the window shows empty space, and the loop visibly jumps
 * once the track runs out.
 *
 * This implementation fixes that at the structural level:
 *
 *   1. `COPIES` full repetitions are rendered, enough that
 *      `COPIES * copyWidth` comfortably exceeds the widest viewport. There is
 *      always content under the viewport, so no gap can ever appear.
 *   2. Each copy is a `shrink-0` flex row, so every copy has an *identical*
 *      intrinsic width W. Track width = `COPIES * W`.
 *   3. The animation travels `-W`, expressed as
 *      `calc(-100% / COPIES)`. Because `100%` resolves against the track width
 *      (`COPIES * W`), `-100% / COPIES` is exactly `-W` — one complete copy.
 *      At that offset, copy N+1 sits precisely where copy N was, pixel for
 *      pixel, because they are the same markup with the same width.
 *   4. The gap that follows the last item lives in a trailing spacer *inside*
 *      each copy, so the spacing between copies is identical to the spacing
 *      within them. Without this, the seam between copies is visibly tighter
 *      than the internal rhythm.
 *
 * Motion is CSS-only: no JavaScript, no per-frame layout, and it composites on
 * the GPU.
 *
 * Overflow safety: the viewport uses `overflow: hidden` and the track is
 * `w-max`. The page cannot gain a horizontal scrollbar from this element.
 */

export interface MarqueeStat {
  /** Small uppercase label, e.g. "Styles". */
  label: string;
  /** Formatted value, e.g. "30". */
  value: string;
}

interface StatsMarqueeProps {
  stats: MarqueeStat[];
}

/**
 * Repetitions rendered in the track. The real requirement is
 * `COPIES * copyWidth >= viewportWidth`; six copies of a three-stat row lands
 * around 3.5–4k px, which covers desktop and large external displays without
 * leaving dead space. The animation travels one copy, so adding copies costs
 * layout but never changes the loop.
 */
const COPIES = 6;

/**
 * Duration of one full copy's travel. Long enough to read as a considered
 * editorial ticker rather than a scrolling marquee.
 */
const DURATION_S = 42;

/** Separator between items. Decorative. */
function Dot() {
  return (
    <span aria-hidden className="select-none text-accent-400/50">
      &middot;
    </span>
  );
}

export function StatsMarquee({ stats }: StatsMarqueeProps) {
  if (stats.length === 0) return null;

  return (
    <div className="threads-marquee-viewport overflow-hidden border-y border-ink-800/80 bg-ink-950 py-5">
      <div
        className="threads-marquee-track flex w-max"
        style={
          {
            // Consumed by the keyframes in globals.css.
            "--marquee-copies": COPIES,
            animationDuration: `${DURATION_S}s`,
          } as React.CSSProperties
        }
      >
        {Array.from({ length: COPIES }, (_, copy) => (
          <ul
            key={copy}
            className="threads-marquee-copy flex shrink-0 items-center"
            /* Copies 2..n are purely visual repetition; keep them out of the
               accessibility tree so the stats are announced once. */
            aria-hidden={copy === 0 ? undefined : "true"}
          >
            {stats.map((stat) => (
              <li key={`${copy}-${stat.label}`} className="flex shrink-0 items-center">
                <span className="flex items-baseline gap-2.5">
                  <span className="font-mono text-base font-bold tabular-nums text-bone-50 sm:text-lg">
                    {stat.value}
                  </span>
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-ink-300">
                    {stat.label}
                  </span>
                </span>
                <Dot />
              </li>
            ))}

            {/* Trailing spacer. Carries the same gap as the other items, so the
                seam between two copies matches the internal rhythm exactly and
                every copy measures the identical width. */}
            <span aria-hidden className="threads-marquee-gap" />
          </ul>
        ))}
      </div>
    </div>
  );
}