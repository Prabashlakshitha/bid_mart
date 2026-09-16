/**
 * Session handling is now Supabase Auth's job (see lib/supabase/server.js and
 * lib/supabase/client.js) rather than the hand-rolled bcrypt + signed-cookie
 * scheme this file used to implement.
 *
 * This re-export exists so the ~14 pages and routes that import
 * `getCurrentUser` from "@/lib/auth" didn't all need their import line
 * changed. The three auth routes (register/login/logout) talk to Supabase
 * directly instead, since they need the full signUp/signInWithPassword/
 * signOut API, not just the current user.
 */
export { getCurrentUser } from "./supabase/server";
