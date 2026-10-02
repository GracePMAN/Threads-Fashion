"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasPurchasedProduct, getUserReviewForProduct } from "@/lib/queries";
import {
  MAX_REVIEW_CHARS,
  type ReviewFormState,
} from "@/lib/review-state";

/**
 * Review Server Actions.
 *
 * Eligibility rules enforced here on the server, in addition to the RLS
 * policies already in place:
 *   1. The caller must be signed in.
 *   2. The caller must have actually purchased the product.
 *   3. A user may hold only one review per product.
 *   4. Ratings must be whole numbers from 1 to 5.
 *   5. Review text must be present and within a sane length.
 *
 * Updates and deletes are additionally scoped to `user_id = caller`, so one
 * user can never modify or remove another user's review.
 */

const MAX_REVIEW_LENGTH = MAX_REVIEW_CHARS;

function validate(rating: number, text: string): string | null {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return "Please choose a rating between 1 and 5 stars.";
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return "Please write a short review before submitting.";
  }
  if (trimmed.length > MAX_REVIEW_LENGTH) {
    return `Reviews are limited to ${MAX_REVIEW_LENGTH} characters.`;
  }
  return null;
}

export async function submitReview(
  productId: string,
  formData: FormData,
): Promise<ReviewFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Please sign in to write a review." };
  }

  const rating = Number(formData.get("rating"));
  const text = String(formData.get("reviewText") ?? "");

  const validationError = validate(rating, text);
  if (validationError) {
    return { status: "error", message: validationError };
  }

  // Eligibility: only genuine purchasers may review.
  const purchased = await hasPurchasedProduct(user.id, productId);
  if (!purchased) {
    return {
      status: "error",
      message: "Only customers who have purchased this product can review it.",
    };
  }

  // One review per user per product: update in place if one already exists.
  const existing = await getUserReviewForProduct(user.id, productId);

  if (existing) {
    const { error } = await supabase
      .from("product_reviews")
      .update({ rating, review_text: text.trim(), updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[threads-ng] review update failed:", error.message);
      return { status: "error", message: "We could not update your review. Please try again." };
    }
  } else {
    const { error } = await supabase.from("product_reviews").insert({
      product_id: productId,
      user_id: user.id,
      rating,
      review_text: text.trim(),
    });

    if (error) {
      // A unique index on (product_id, user_id) surfaces here as a conflict.
      console.error("[threads-ng] review insert failed:", error.message);
      return {
        status: "error",
        message: "We could not save your review. Please try again.",
      };
    }
  }

  revalidatePath(`/product/${productId}`);
  return { status: "success", message: existing ? "Review updated." : "Review submitted." };
}

export async function deleteReview(productId: string): Promise<ReviewFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Please sign in to manage your review." };
  }

  // Scoped to the caller's own rows.
  const { error } = await supabase
    .from("product_reviews")
    .delete()
    .eq("product_id", productId)
    .eq("user_id", user.id);

  if (error) {
    console.error("[threads-ng] review delete failed:", error.message);
    return { status: "error", message: "We could not delete your review." };
  }

  revalidatePath(`/product/${productId}`);
  return { status: "success", message: "Review deleted." };
}
