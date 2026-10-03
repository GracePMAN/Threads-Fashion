"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { GoogleIcon } from "@/components/GoogleIcon";
import { beginActionLoading, endActionLoading } from "@/components/ui/ActionLoading";

/**
 * Google sign-in submit button.
 *
 * Rendered as a client component so it can observe the form's real pending
 * state via `useFormStatus`, which is what drives the small in-app THREADS NG
 * loading card while the OAuth round-trip starts.
 *
 * Crucially this changes NOTHING about how sign-in works:
 *   - the parent `<form action={signInWithGoogle}>` is untouched,
 *   - the Server Action, the hidden `redirectTo` field and the PKCE flow are
 *     untouched,
 *   - it is still a real `type="submit"` button inside the real form.
 *
 * The shoe/kick needs no code here: `KickProvider` handles every button
 * site-wide via one delegated listener.
 */
export function GoogleSignInButton() {
  const { pending } = useFormStatus();
  const started = useRef(false);

  // Show the small loading card only once the form is genuinely submitting.
  useEffect(() => {
    if (pending && !started.current) {
      started.current = true;
      beginActionLoading("Signing you in...");
    } else if (!pending && started.current) {
      started.current = false;
      endActionLoading();
    }
  }, [pending]);

  // If the page unloads mid-flow (OAuth redirect), clear on unmount too.
  useEffect(() => () => {
    if (started.current) {
      started.current = false;
      endActionLoading();
    }
  }, []);

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-full bg-bone-50 px-6 text-sm font-semibold text-ink-950 transition-colors hover:bg-accent-400 disabled:opacity-70"
    >
      <GoogleIcon className="size-5" />
      Continue with Google
    </button>
  );
}
