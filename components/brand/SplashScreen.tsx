"use client";

import { useEffect, useRef, useState } from "react";
import { ThreadsLogo } from "@/components/brand/ThreadsLogo";
import { BRAND } from "@/lib/brand";
import { LoadingCard } from "@/components/ui/LoadingCard";
import { useAppLoading } from "@/components/ui/AppLoadingProvider";
import { SPLASH_COOKIE } from "@/lib/splash";

/**
 * Initial THREADS NG splash — the large loading card context.
 *
 * WHY IT CANNOT FLASH THE PAGE FIRST
 * The splash decision comes from the `alreadySeen` prop, which the SERVER layout
 * reads from a cookie. So the server already knows whether to render the splash
 * and sends exactly that markup:
 *
 *   - new session  -> server renders the splash, so it is the FIRST paint
 *   - returning     -> server omits the splash, so the page is the FIRST paint
 *
 * Because the client receives the same `alreadySeen` value it can never disagree
 * with the server, so there is no hydration mismatch and no discarded tree.
 */

/** Minimum fully-visible time, so the splash is actually perceivable. */
const MIN_MS = 3400;

/**
 * Hard ceiling / failsafe. Independent of the minimum, so the splash can never
 * trap the user even if something goes wrong.
 */
const MAX_MS = 7000;

/** How long the fade-out takes. */
const FADE_MS = 520;

interface SplashScreenProps {
  /**
   * `true` when this browser session has already seen the splash.
   *
   * Read from the cookie by the server layout, so SSR and hydration agree.
   */
  alreadySeen: boolean;
}

export function SplashScreen({ alreadySeen }: SplashScreenProps) {
  const { open } = useAppLoading();

  /** Controls the fade. */
  const [fading, setFading] = useState(false);
  /** THE dismissal source of truth: `null` render + no overlay once true. */
  const [hidden, setHidden] = useState(false);

  // Identical on the server and the client, because it derives only from a prop.
  const shouldShow = !alreadySeen;

  /**
   * Pending timer ids.
   *
   * STRICT MODE: React StrictMode (on by default in `next dev`) mounts an effect,
   * runs its cleanup, then mounts it again. The previous code used an
   * `openedRef` guard, which was fatal: the first mount armed the timers, the
   * simulated cleanup CLEARED them, and the remount saw `openedRef === true` and
   * bailed — so the timers were never re-armed and `hidden` never became true.
   * The splash froze, and the `MAX_MS` failsafe was disarmed by the same line.
   *
   * There is deliberately no "already opened" guard here. Instead:
   *   - cleanup clears only the ids still in this array, and
   *   - `openGate` removes its own ids from the array as they fire,
   *
   * so a remount always re-arms cleanly, and a timer that already fired can never
   * be cancelled out from under a dismissal that is in progress.
   */
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (!shouldShow) {
      // Suppressed for this session: reveal the app immediately, with no splash
      // at all, so there is no overlay and no flash to dismiss.
      open();
      return;
    }

    // Record this session so a reload — and the Google OAuth full-page load,
    // which can be minutes later — does not replay the splash over the app.
    try {
      document.cookie = `${SPLASH_COOKIE}=1; path=/; SameSite=Lax`;
    } catch {
      // Cookies blocked: worst case the splash replays on a later load.
    }

    /** Fades out, then dismisses. Idempotent, so both timers are safe. */
    const openGate = () => {
      setFading(true);

      const fade = window.setTimeout(() => {
        timers.current = timers.current.filter((id) => id !== fade);
        setHidden(true);
      }, FADE_MS);

      timers.current.push(fade);
    };

    const min = window.setTimeout(openGate, MIN_MS);
    const max = window.setTimeout(openGate, MAX_MS);
    timers.current.push(min, max);

    return () => {
      // Clear only what is still pending; anything that already fired has been
      // removed from the array and cannot be cancelled here.
      for (const id of timers.current) window.clearTimeout(id);
      timers.current = [];
    };
  }, [shouldShow, open]);

  if (!shouldShow || hidden) return null;

  return (
    <div
      aria-label={`Loading ${BRAND.name}`}
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-y-auto bg-ink-950 px-5 py-10 transition-opacity duration-500 ${
        fading ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* Warm lime bloom, so the dark page is not an empty void. */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.16] blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--color-accent-400) 0%, transparent 62%)",
        }}
      />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8">
        {/* ---- Brand: TN monogram + THREADS NG + tagline ---- */}
        <ThreadsLogo variant="lockup" height={92} priority onDark className="w-full" />

        {/* ---- The large loading card (shared component, splash variant) ----
             The outer card is fixed; only the inner product visual changes. */}
        <LoadingCard variant="splash" announce />
      </div>
    </div>
  );
}

export default SplashScreen;
