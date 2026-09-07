/**
 * Connection details that are safe in the browser.
 *
 * Imports nothing and touches only NEXT_PUBLIC_* variables, so this module can
 * be pulled into client components. The service role key lives in
 * lib/supabase/admin.js and must never be imported from client code.
 */

/**
 * Reduces whatever was pasted into .env.local to the bare project origin.
 *
 * The Supabase dashboard shows the REST endpoint
 * (https://<ref>.supabase.co/rest/v1/) right next to the project URL, and
 * copying that one is an easy mistake — the client appends its own paths, so
 * the extra suffix turns every call into a 404. Trimming it here means either
 * form works.
 */
export function normalizeProjectUrl(raw) {
  if (!raw) return undefined;
  return raw
    .trim()
    .replace(/\/(rest|auth|storage|realtime)\/v\d+\/?$/i, "")
    .replace(/\/+$/, "");
}

export const SUPABASE_URL = normalizeProjectUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);

/**
 * The anon (publishable) key. Despite the name it is meant to be public — it
 * only ever grants what row level security allows, which is why the policies
 * in supabase/schema.sql are the thing actually protecting your data.
 */
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isAuthConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
