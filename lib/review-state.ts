/**
 * Shared review form types and defaults.
 *
 * These live outside the `"use server"` module on purpose: every export from a
 * "use server" file must be an async function, so a plain constant exported
 * from there is misinterpreted as a server action reference.
 */
export interface ReviewFormState {
  status: "idle" | "success" | "error";
  message: string;
}

export const IDLE_REVIEW_STATE: ReviewFormState = { status: "idle", message: "" };

/** Keep in sync with the server-side length check in the review action. */
export const MAX_REVIEW_CHARS = 1000;
