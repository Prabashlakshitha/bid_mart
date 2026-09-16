import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, normalizeProjectUrl } from "./url";

/**
 * Service-role Supabase client. SERVER ONLY — never import this from a client
 * component. It bypasses row level security entirely.
 *
 * Used for jobs the signed-in user's own client can't do:
 *   - uploading and deleting files in Storage (lib/uploads.js)
 *   - looking up a user's email by id (lib/db.js) — email lives in Supabase's
 *     auth.users table, which PostgREST never exposes, so the only way to
 *     read it server-side is the Auth admin API
 *   - the one-off data migration in scripts/migrate-to-supabase.js
 */

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "bidmart-images";

/** True when the environment has the credentials needed to upload. */
export function isStorageConfigured() {
  return Boolean(SUPABASE_URL && SERVICE_KEY);
}

/**
 * The prefix every public URL in our bucket starts with. Used to check that a
 * media URL a client hands back really came from an upload we performed.
 */
export function publicUrlPrefix() {
  if (!SUPABASE_URL) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;
}

let client = null;

/** Server-only Supabase client. Returns null when storage isn't configured. */
export function getSupabase() {
  if (!isStorageConfigured()) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/**
 * Maps every user id to their email in one call, for admin pages that list
 * many users/requests at once (avoids one Auth API round trip per row).
 * Caller must already have verified the current user is an admin — this
 * bypasses RLS entirely, same as the rest of this module.
 */
export async function listUserEmails() {
  const supabase = getSupabase();
  if (!supabase) return new Map();

  const map = new Map();
  let page = 1;
  // 1000 is the max Supabase allows per page; loop in case there are more.
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error("[supabase] listUserEmails failed:", error.message);
      break;
    }
    for (const u of data.users) map.set(u.id, u.email);
    if (data.users.length < 1000) break;
    page += 1;
  }
  return map;
}

export { normalizeProjectUrl };
