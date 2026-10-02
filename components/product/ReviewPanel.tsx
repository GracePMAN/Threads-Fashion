"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { StarInput } from "@/components/Stars";
import { submitReview, deleteReview } from "@/app/product/[id]/actions";
import {
  IDLE_REVIEW_STATE,
  MAX_REVIEW_CHARS,
  type ReviewFormState,
} from "@/lib/review-state";

interface ReviewPanelProps {
  productId: string;
  currentUser: { id: string; name: string; email: string } | null;
  canReview: boolean;
  ownReview: { rating: number; review_text: string | null } | null;
  /** Called by the parent after a successful save or delete. */
  onChanged: () => void;
}

/**
 * Review form, shown only to a signed-in customer who has purchased the product.
 * If they already have a review it renders in edit mode rather than creating a
 * duplicate, matching the one-review-per-product rule.
 */
export function ReviewPanel({
  productId,
  currentUser,
  canReview,
  ownReview,
  onChanged,
}: ReviewPanelProps) {
  const [state, setState] = useState<ReviewFormState>(IDLE_REVIEW_STATE);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(ownReview?.rating ?? 0);
  const [text, setText] = useState(ownReview?.review_text ?? "");
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("rating", String(rating));
    formData.set("reviewText", text);

    startTransition(async () => {
      const result = await submitReview(productId, formData);
      setState(result);
      if (result.status === "success") {
        setOpen(false);
        onChanged();
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteReview(productId);
      setState(result);
      if (result.status === "success") {
        setRating(0);
        setText("");
        setOpen(false);
        onChanged();
      }
    });
  }

  function close() {
    setOpen(false);
    setRating(ownReview?.rating ?? 0);
    setText(ownReview?.review_text ?? "");
  }

  // Signed out: prompt to sign in.
  if (!currentUser) {
    return (
      <div className="mt-8 rounded-xl border border-ink-800 bg-ink-900/50 p-6 text-center">
        <p className="text-sm text-ink-300">
          Have you bought this piece? Sign in to leave a review.
        </p>
        <Link
          href={`/login?redirectTo=${encodeURIComponent(`/product/${productId}#reviews`)}`}
          className="mt-4 inline-flex h-10 items-center rounded-full bg-bone-50 px-6 text-xs font-semibold text-ink-950 transition-colors hover:bg-accent-400"
        >
          Sign in with Google
        </Link>
      </div>
    );
  }

  // Signed in but never bought it: not eligible.
  if (!canReview) {
    return (
      <p className="mt-8 rounded-xl border border-ink-800 bg-ink-900/50 p-6 text-center text-sm text-ink-400">
        Only customers who have purchased this product can review it.
      </p>
    );

  return (
    <div className="mt-8">
      {state.status !== "idle" && (
        <p
          role="status"
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            state.status === "success"
              ? "border-accent-400/40 bg-accent-400/10 text-accent-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {state.message}
        </p>
      )}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-10 items-center rounded-full border border-ink-700 px-6 text-xs font-semibold text-bone-100 transition-colors hover:border-accent-400 hover:text-accent-400"
        >
          {ownReview ? "Edit your review" : "Write a review"}
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-ink-800 bg-ink-900/50 p-6"
        >
          <h3 className="text-sm font-semibold text-bone-50">
            {ownReview ? "Edit your review" : "Your review"}
          </h3>

          <div className="mt-4">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-ink-300">
              Rating
            </span>
            <StarInput value={rating} onChange={setRating} disabled={pending} />
          </div>

          <div className="mt-4">
            <label
              htmlFor="reviewText"
              className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-ink-300"
            >
              Your review
            </label>
            <textarea
              id="reviewText"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              maxLength={MAX_REVIEW_CHARS}
              disabled={pending}
              placeholder="How does it fit? How does the material feel?"
              className="w-full resize-y rounded-lg border border-ink-700 bg-ink-950 p-3 text-sm text-bone-50 placeholder:text-ink-500 transition-colors focus:border-accent-400 focus:outline-none disabled:opacity-60"
            />
            <p className="mt-1 text-right text-[0.7rem] text-ink-500">
              {text.length}/{MAX_REVIEW_CHARS}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-10 items-center rounded-full bg-accent-400 px-6 text-xs font-bold text-ink-950 transition-colors hover:bg-accent-300 disabled:opacity-50"
            >
              {pending ? "Saving…" : ownReview ? "Update review" : "Submit review"}
            </button>
            <button
              type="button"
              onClick={close}
              disabled={pending}
              className="inline-flex h-10 items-center rounded-full border border-ink-700 px-6 text-xs font-semibold text-bone-100 transition-colors hover:border-ink-500 disabled:opacity-50"
            >
              Cancel
            </button>
            {ownReview && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                className="inline-flex h-10 items-center rounded-full border border-red-500/30 px-6 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-50"
              >
                Delete
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

  }
