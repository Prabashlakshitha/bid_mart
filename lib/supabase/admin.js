import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, normalizeProjectUrl } from "./url";

/**
 * Service-role Supabase client. SERVER ONLY — never import this from a client
 * component. It bypasses row level security entirely.
 *
 * Used for two jobs the signed-in user's own client can't do:
 *   - uploading and deleting files in Storage (lib/uploads.js)
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

export { normalizeProjectUrl };
