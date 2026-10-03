/**
 * Shared splash constants.
 *
 * Lives in a plain module (not a `"use client"` file) because BOTH the server
 * layout and the client splash need to agree on the cookie name.
 */

/**
 * Session cookie recording that the splash has already been shown.
 *
 * WHY A COOKIE AND NOT `sessionStorage`
 * ------------------------------------
 * `sessionStorage` is browser-only, so it cannot be read while rendering on the
 * server. Reading it from a client-side render path therefore made the server
 * emit the splash while the client decided not to render it — a hydration
 * mismatch. React responds by discarding and re-rendering the client tree, which
 * tore down and remounted parts of the app (including `KickProvider`'s
 * document-level pointer listener), making the shoe-kick appear to break after
 * Google OAuth.
 *
 * A cookie is readable by the server layout AND by the browser, so the server
 * and the client make the identical decision for the same request. No mismatch,
 * and the client tree is never discarded.
 *
 * Deliberately a SESSION cookie (no `Max-Age`/`Expires`): it lives exactly as
 * long as the browser session, so a genuinely new session still gets the splash,
 * while a reload or the OAuth full-page load does not replay it.
 */
export const SPLASH_COOKIE = "threads-ng-splash-seen";
