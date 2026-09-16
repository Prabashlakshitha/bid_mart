import { createClient } from "./supabase/server";

/**
 * Data layer, backed by Supabase Postgres (see supabase/schema.sql) instead
 * of the data/db.json file this used to read and write with `fs`. That file
 * is what made the app impossible to deploy to Cloudflare Workers — there is
 * no writable filesystem there.
 *
 * Every function here opens a session-bound client (via lib/supabase/server),
 * so every query runs as the signed-in user and is subject to the row level
 * security policies in the schema. That means permissions are enforced by
 * Postgres itself, not only by the `if` checks in the route handlers that
 * call these functions — the route-level checks stay, as a second layer and
 * for friendlier error messages, but the database is the real guard.
 */

/**
 * Computes the minimum (starting) price from cost + margin.
 * This is the one calculation the whole bidding system hangs on. Pure — no
 * database involved — so it's unchanged from the original.
 */
export function computeMinPrice(costPrice, marginPercent) {
  const cost = Number(costPrice);
  const margin = Number(marginPercent);
  const min = cost + cost * (margin / 100);
  return Math.round(min * 100) / 100;
}

/**
 * Closes any auctions whose end_time has passed (marks them sold/unsold and
 * raises an order for the winner). Runs in Postgres via close_expired_auctions()
 * so it can't half-finish, and is safe to call on every page load like before.
 */
export async function closeExpiredAuctions() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("close_expired_auctions");
  if (error) console.error("[db] closeExpiredAuctions failed:", error.message);
}

// ---- Products -------------------------------------------------------------

/**
 * Postgres `numeric` columns (cost_price, min_price, bid_increment, …) come
 * back through PostgREST as JSON — this coerces them to real JS numbers at
 * the boundary so nothing downstream has to think about it. Without this,
 * `product.current_highest_bid + product.bid_increment` in BidForm.js would
 * silently do string concatenation instead of addition if a value ever
 * arrived as a string.
 */
function toNumberFields(row, fields) {
  if (!row) return row;
  const copy = { ...row };
  for (const f of fields) {
    if (copy[f] !== null && copy[f] !== undefined) copy[f] = Number(copy[f]);
  }
  return copy;
}

const PRODUCT_NUMERIC_FIELDS = ["cost_price", "margin_percent", "min_price", "current_highest_bid", "bid_increment"];
const normalizeProduct = (p) => toNumberFields(p, PRODUCT_NUMERIC_FIELDS);
const normalizeBid = (b) => toNumberFields(b, ["amount"]);
const normalizeOrder = (o) => toNumberFields(o, ["final_price"]);

export async function getProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data.map(normalizeProduct);
}

export async function getProductById(id) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return normalizeProduct(data);
}

export async function getBidsForProduct(productId) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bids")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data.map(normalizeBid);
}

/** Admin-only at the route level; RLS's products_write policy enforces it too. */
export async function createProduct(fields) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").insert(fields).select().single();
  if (error) throw new Error(error.message);
  return normalizeProduct(data);
}

/**
 * Places a bid via the place_bid() Postgres function, which locks the product
 * row for the duration of the check-then-write — the fix for the race where
 * two simultaneous bids on data/db.json could both "win". Throws an Error
 * with a `.status` the caller can use directly as the HTTP status.
 */
export async function placeBid(productId, amount) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("place_bid", { p_product_id: productId, p_amount: amount })
    .single();

  if (error) {
    const err = new Error(error.message);
    if (error.code === "P0002") err.status = 404; // product not found
    else if (error.code === "42501") err.status = 401; // not logged in
    else err.status = error.message.includes("ended") ? 409 : 400;
    throw err;
  }
  return normalizeBid(data);
}

// ---- Comments ---------------------------------------------------------

export async function getCommentsForProduct(productId) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function getCommentById(id) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("comments").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function createComment(fields) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("comments").insert(fields).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteCommentById(id) {
  const supabase = await createClient();
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- Item requests ----------------------------------------------------

/**
 * RLS scopes this automatically: an admin session gets every request, any
 * other session gets only their own (see requests_select in the schema) — no
 * extra filter needed here, unlike the old in-memory version.
 */
export async function getRequests() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function getRequestById(id) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("requests").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function createRequest(fields) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("requests").insert(fields).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateRequestStatus(id, status) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("requests")
    .update({ status })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteRequestById(id) {
  const supabase = await createClient();
  const { error } = await supabase.from("requests").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- Orders -------------------------------------------------------------

/**
 * RLS scopes this the same way as requests: admin sees every order, anyone
 * else sees only their own. Product title and buyer name are embedded via
 * their foreign keys in one query rather than N+1 lookups.
 */
export async function getOrders() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, product:products(title), buyer:profiles(name)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data.map(normalizeOrder);
}

// ---- Users (admin only) --------------------------------------------------

/**
 * Every registered account plus their bid/order/request counts, for
 * Admin -> Users. Email comes from lib/supabase/admin.js's listUserEmails()
 * since PostgREST never exposes auth.users.
 */
export async function getUsersWithStats(emailByUserId) {
  const supabase = await createClient();
  const [{ data: profiles, error: pErr }, { data: bids, error: bErr }, { data: orders, error: oErr }, { data: requests, error: rErr }] =
    await Promise.all([
      supabase.from("profiles").select("id, name, role, created_at").order("created_at", { ascending: false }),
      supabase.from("bids").select("user_id"),
      supabase.from("orders").select("user_id"),
      supabase.from("requests").select("user_id"),
    ]);
  const err = pErr || bErr || oErr || rErr;
  if (err) throw new Error(err.message);

  const count = (rows, id) => rows.filter((r) => r.user_id === id).length;
  return profiles.map((p) => ({
    ...p,
    email: emailByUserId.get(p.id) || "",
    bids: count(bids, p.id),
    orders: count(orders, p.id),
    requests: count(requests, p.id),
  }));
}
