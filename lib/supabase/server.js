import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./url";

/**
 * Supabase client for Server Components and Route Handlers, bound to the
 * signed-in user via their session cookie.
 *
 * Every query made through this client runs as that user, so the row level
 * security policies in supabase/schema.sql apply. That's deliberate: the
 * database enforces who can see what, and the route handlers are a second
 * layer rather than the only one.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Components can't set cookies. Harmless: middleware.js
          // refreshes the session on every request, so the token stays fresh.
        }
      },
    },
  });
}

/**
 * The current user as the app thinks of them: their auth record joined with
 * the profile row that carries `name` and `role`. Returns null when logged out.
 */
export async function getCurrentUser() {
  const supabase = createClient();

  // getUser() re-validates the token with Supabase rather than trusting the
  // cookie's contents, which is what makes it safe to authorise against.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email,
    name: profile?.name || user.email?.split("@")[0] || "User",
    role: profile?.role || "user",
  };
}
