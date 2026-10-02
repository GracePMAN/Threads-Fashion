import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth callback for Supabase Auth.
 *
 * Supabase redirects here with a `code` query parameter. Exchanging it for a
 * session sets the auth cookies, so the user stays signed in after logging out
 * and back in, and their previous orders remain available.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/orders";

  // Only allow same-origin paths.
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/auth")
      ? next
      : "/orders";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
    console.error("[threads-ng] auth callback failed:", error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=callback_failed`);
}
