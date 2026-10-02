"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ProductReview } from "@/lib/types";
import { Stars } from "@/components/Stars";
import { ReviewPanel } from "@/components/product/ReviewPanel";
import { deleteReview } from "@/app/product/[id]/actions";
import { formatDate } from "@/lib/money";

interface ReviewsProps {
  productId: string;
  reviews: ProductReview[];
  average: number;
  currentUser: { id: string; name: string; email: string } | null;
  canReview: boolean;
  ownReview: ProductReview | null;
}

/**
 * Reviews section: summary, list, and the owner-only review panel.
 *
 * Only the signed-in owner sees Edit/Delete controls on a review, and those
 * actions are scoped to `user_id` on the server.
 */
export function Reviews({
  productId,
  reviews,
  average,
  currentUser,
  canReview,
  ownReview,
}: ReviewsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteReview(productId);
      if (result.status === "success") router.refresh();
    });
  }

  return (
    <section id="reviews" className="scroll-mt-24" aria-labelledby="reviews-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Feedback</p>
          <h2 id="reviews-heading" className="section-title mt-3">
            Customer reviews
          </h2>
        </div>
        <div className="text-right">
          <Stars value={average} size="md" showValue={false} />
          <p className="mt-1 text-xs text-ink-400">
            {average > 0 ? average.toFixed(1) : "—"} · {reviews.length}{" "}
            {reviews.length === 1 ? "review" : "reviews"}
          </p>
        </div>
      </div>

      <ReviewPanel
        productId={productId}
        currentUser={currentUser}
        canReview={canReview}
        ownReview={ownReview}
        onChanged={() => router.refresh()}
      />

      <div className="mt-10 space-y-4">
        {reviews.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-800 px-6 py-12 text-center text-sm text-ink-400">
            No reviews yet. Be the first to review this piece.
          </p>
        ) : (
          reviews.map((review) => {
            const isOwn = currentUser?.id === review.user_id;
            const wasEdited =
              review.updated_at &&
              review.created_at &&
              new Date(review.updated_at).getTime() >
                new Date(review.created_at).getTime() + 1000;

            return (
              <article
                key={review.id}
                className={`rounded-xl border p-5 ${
                  isOwn
                    ? "border-accent-400/30 bg-accent-400/[0.04]"
                    : "border-ink-800 bg-ink-900/40"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="flex size-9 items-center justify-center rounded-full bg-ink-700 font-mono text-xs font-bold text-bone-100"
                    >
                      {isOwn ? (currentUser?.name ?? "Y").charAt(0).toUpperCase() : "C"}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-bone-50">
                        {isOwn ? "You" : "Verified customer"}
                      </p>
                      <p className="text-[0.7rem] text-ink-500">
                        {formatDate(review.created_at)}
                        {wasEdited && " · edited"}
                      </p>
                    </div>
                  </div>
                  <Stars value={review.rating} size="sm" showValue={false} />
                </div>

                {review.review_text && (
                  <p className="mt-3 text-sm leading-relaxed text-ink-300">
                    {review.review_text}
                  </p>
                )}

                {isOwn && (
                  <div className="mt-4 flex gap-4 border-t border-ink-800 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        // The panel above owns the edit form; jump to it.
                        document
                          .getElementById("reviewText")
                          ?.scrollIntoView({ behavior: "smooth", block: "center" });
                        (document.getElementById("reviewText") as HTMLTextAreaElement | null)
                          ?.focus();
                      }}
                      className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-accent-400 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={pending}
                      className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-red-400 hover:underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
