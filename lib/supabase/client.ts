import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 *
 * Uses @supabase/ssr so that the auth session is stored in cookies rather than
 * localStorage. That is what allows Server Components and Server Actions to read
 * the same session via `lib/supabase/server.ts`.
 *
 * Only the publishable (public) key is ever referenced here.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
