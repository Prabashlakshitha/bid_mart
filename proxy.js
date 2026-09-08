import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/url";

/**
 * Keeps the Supabase session alive.
 *
 * Access tokens expire after an hour. Server Components can read cookies but
 * can't write them, so without this the refreshed token would have nowhere to
 * go and users would be silently logged out. This runs before every request
 * and *can* write cookies, so refreshing here is the supported pattern.
 *
 * Next 16 renamed this file convention from `middleware` to `proxy`.
 */
export default async function proxy(request) {
  let response = NextResponse.next({ request });

  // No credentials configured yet: get out of the way rather than 500.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Touching getUser() is what triggers the refresh. Don't remove it.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Everything except static assets and image files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|mov)$).*)",
  ],
};
