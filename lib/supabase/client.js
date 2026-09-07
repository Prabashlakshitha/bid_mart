"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./url";

/**
 * Supabase client for the browser. Used only for the auth calls — sign up,
 * sign in, sign out — because those need to write the session cookie from the
 * client side. All data still goes through the app's own API routes.
 */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
