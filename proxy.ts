import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Keeps the Supabase auth session fresh across the app.
 *
 * Next.js 16 renamed the middleware entrypoint to `proxy.ts`; the export and
 * behaviour are otherwise identical to the previous `middleware.ts`.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on every request except static assets and image files, so that
     * Server Components and Server Actions always see a current session.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
