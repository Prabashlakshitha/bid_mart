import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { readDb } from "./db";

// In a real deployment, set SESSION_SECRET as an environment variable.
// This fallback is fine for local/demo use only.
const SECRET = process.env.SESSION_SECRET || "dev-only-secret-change-me";
const COOKIE_NAME = "bidmart_session";

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function sign(value) {
  const hmac = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  return `${value}.${hmac}`;
}

function unsign(signed) {
  if (!signed) return null;
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  if (sig.length !== expected.length) return null;
  const ok = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  return ok ? value : null;
}

export function createSessionCookieValue(userId) {
  return sign(String(userId));
}

export function getUserIdFromCookieValue(cookieValue) {
  const value = unsign(cookieValue);
  return value ? Number(value) : null;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;

/**
 * Server Component / Route Handler helper: get the current logged-in user,
 * or null.
 *
 * Async because Next 15 made cookies() return a promise — every caller has to
 * await this.
 */
export async function getCurrentUser() {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  const userId = getUserIdFromCookieValue(raw);
  if (!userId) return null;
  const db = readDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;
  const { password_hash, ...safeUser } = user;
  return safeUser;
}
