"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * Authentication Server Actions.
 *
 * Google OAuth is handled entirely by Supabase Auth. No Google client id or
 * client secret is ever present in this application; only the Supabase
 * publishable key is used, so there is nothing secret to leak.
 */

/** Where to land after a successful sign-in, validated against known routes. */
function safeRedirect(target: string | null | undefined): string {
  // Only allow same-origin, known app paths.
  if (!target || !target.startsWith("/") || target.startsWith("//")) return "/orders";
  if (target.startsWith("/auth/")) return "/orders";
  return target;
}

export async function signInWithGoogle(formData: FormData) {
  const redirectTo = safeRedirect(formData.get("redirectTo")?.toString());
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      // Supabase redirects to this route, exchanges the code for a session and
      // sets the auth cookies before bouncing on to `next`.
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? (await siteOrigin())}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      scopes: "openid email profile",
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error) {
    console.error("[threads-ng] google sign-in failed:", error.message);
    redirect("/login?error=sign_in_failed");
  }

  // Supabase returns an absolute URL to Google's consent screen.
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

/** Best-effort origin for building absolute OAuth callback URLs. */
async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return host ? `${proto}://${host}` : "http://localhost:3000";
}
