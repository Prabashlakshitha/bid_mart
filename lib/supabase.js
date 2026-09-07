import { createClient } from "@supabase/supabase-js";

/**
 * Supabase is used for one job in this project: storing uploaded image files.
 * Product/bid/comment records still live in data/db.json (see lib/db.js).
 *
 * Uploads always go through our own route handlers using the service role key,
 * never from the browser — that way the existing cookie session in lib/auth.js
 * stays the only thing deciding who is allowed to upload what, and the key is
 * never shipped to the client.
 */

/**
 * Reduces whatever was pasted into .env.local to the bare project origin.
 *
 * The Supabase dashboard shows the REST endpoint
 * (https://<ref>.supabase.co/rest/v1/) right next to the project URL, and
 * copying that one is an easy mistake — the client appends its own paths, so
 * the extra suffix turns every storage call into a 404. Trimming it here means
 * either form works.
 */
function normalizeProjectUrl(raw) {
  if (!raw) return undefined;
  return raw.trim().replace(/\/(rest|auth|storage|realtime)\/v\d+\/?$/i, "").replace(/\/+$/, "");
}

const URL = normalizeProjectUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "bidmart-images";

/**
 * True when the environment has the credentials needed to upload.
 * The app deliberately keeps working without them — image URL fields fall
 * back to pasting a link, so a fresh clone runs with no setup at all.
 */
export function isStorageConfigured() {
  return Boolean(URL && SERVICE_KEY);
}

/**
 * The prefix every public URL in our bucket starts with. Used to check that an
 * image URL a client hands back really came from an upload we performed.
 */
export function publicUrlPrefix() {
  if (!URL) return null;
  return `${URL.replace(/\/+$/, "")}/storage/v1/object/public/${BUCKET}/`;
}

let client = null;

/** Server-only Supabase client. Returns null when storage isn't configured. */
export function getSupabase() {
  if (!isStorageConfigured()) return null;
  if (!client) {
    client = createClient(URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
