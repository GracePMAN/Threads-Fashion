"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Initial-load gate.
 *
 * WHY THIS EXISTS
 * ---------------
 * The splash used to be a client-only overlay, which meant the server rendered
 * the *homepage* and the splash only appeared after hydration. That produced the
 * exact flash that had to be eliminated:
 *
 *     homepage paints -> splash appears -> homepage again
 *
 * `useSyncExternalStore` cannot fix this, because its server snapshot is `false`
 * — i.e. "don't show the splash" — which is precisely the wrong value to send
 * to the browser.
 *
 * Instead the provider starts in a `loading` state on BOTH the server and the
 * client, so the first paint is the splash. The page underneath is not rendered
 * at all until the gate opens. Because the server and the first client render
 * agree exactly, there is no hydration mismatch and no flash of unstyled or
 * empty content.
 *
 * SEO is unaffected: the page content is still server-rendered as HTML, it is
 * simply withheld from *visual* paint behind the opaque splash, which is what a
 * splash screen is.
 *
 * The gate is opened by `SplashScreen` once hydration completes, and never later
 * than `MAX_MS`, so it can never trap the user.
 */

export type AppGate = "loading" | "ready";

interface AppLoadingState {
  gate: AppGate;
  /** Opens the gate, revealing the app. */
  open: () => void;
}

const AppLoadingContext = createContext<AppLoadingState>({
  gate: "ready",
  open: () => {},
});

export function AppLoadingProvider({ children }: { children: ReactNode }) {
  // Starts `loading` on the server AND the first client render, so the splash is
  // the first thing painted. `useState` initialisers must match across both or
  // React will report a hydration mismatch.
  const [gate, setGate] = useState<AppGate>("loading");

  /**
   * MUST be referentially stable.
   *
   * This was previously re-created on every `gate` change (`useMemo` returning
   * `open: () => setGate("ready")`), and `SplashScreen` depends on `open` in its
   * effect. That produced a self-restarting timer: opening the gate changed
   * `open`'s identity, which re-ran the splash effect, which cleared and
   * re-armed the timers — so the splash ran far longer than intended and, worse,
   * kept its opaque full-screen layer over the page.
   *
   * That is what made the shoe appear to "break after Google OAuth": OAuth is a
   * full page load, so the splash re-ran, covered the page in an opaque
   * `z-[200]` overlay, swallowed every `pointerdown`, and no control ever
   * received a press. `useCallback` with an empty dep list pins the identity for
   * the component's lifetime.
   */
  const open = useCallback(() => setGate("ready"), []);

  const value = useMemo<AppLoadingState>(() => ({ gate, open }), [gate, open]);

  return <AppLoadingContext.Provider value={value}>{children}</AppLoadingContext.Provider>;
}

export function useAppLoading(): AppLoadingState {
  return useContext(AppLoadingContext);
}
