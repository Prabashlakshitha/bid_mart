/**
 * One-off migration: data/db.json -> Supabase (Auth + Postgres).
 *
 *   npm run migrate
 *
 * Run supabase/schema.sql in the Supabase SQL Editor first.
 *
 * Safe to re-run: every insert is an upsert keyed on the original id, and
 * accounts that already exist in Auth are reused rather than duplicated.
 * Nothing is deleted from db.json — it stays as a backup.
 *
 * Existing bcrypt password hashes are imported directly, so nobody has to
 * reset their password.
 */
const fs = require("fs");
const path = require("path");
const { loadEnvConfig } = require("@next/env");
const { createClient } = require("@supabase/supabase-js");

loadEnvConfig(process.cwd());

const RAW_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const URL = RAW_URL
  ? RAW_URL.trim().replace(/\/(rest|auth|storage|realtime)\/v\d+\/?$/i, "").replace(/\/+$/, "")
  : RAW_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DB_PATH = path.join(process.cwd(), "data", "db.json");

function die(message, fix) {
  console.error(`\n  ✗ ${message}`);
  if (fix) console.error(`\n    ${fix}\n`);
  process.exit(1);
}

async function main() {
  console.log("\nMigrating data/db.json into Supabase\n");

  if (!URL || !KEY) die("Supabase credentials missing from .env.local.", "Run: npm run check:supabase");
  if (!fs.existsSync(DB_PATH)) die("data/db.json not found — nothing to migrate.");

  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

  // Fail early with a clear message if the schema hasn't been applied.
  const { error: schemaError } = await supabase.from("profiles").select("id").limit(1);
  if (schemaError) {
    die(
      `Could not read the profiles table: ${schemaError.message}`,
      "Open supabase/schema.sql, paste it into the Supabase SQL Editor, and run it. Then try again."
    );
  }

  // ---- users -> auth.users + profiles -------------------------------------
  const idMap = new Map(); // old integer id -> new uuid

  const { data: existing } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const byEmail = new Map((existing?.users || []).map((u) => [u.email.toLowerCase(), u]));

  for (const user of db.users) {
    const email = user.email.toLowerCase();
    let authUser = byEmail.get(email);

    if (authUser) {
      console.log(`  = ${email} already in Auth, reusing`);
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        // Import the existing bcrypt hash so passwords keep working.
        password_hash: user.password_hash,
        email_confirm: true,
        user_metadata: { name: user.name },
      });
      if (error) die(`Could not create ${email}: ${error.message}`);
      authUser = data.user;
      console.log(`  + ${email} created in Auth`);
    }

    idMap.set(user.id, authUser.id);

    // The signup trigger creates the profile; make sure name and role match
    // what db.json had (the trigger always defaults role to 'user').
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: authUser.id, name: user.name, role: user.role, created_at: user.created_at });
    if (profileError) die(`Could not write profile for ${email}: ${profileError.message}`);
  }

  const uid = (oldId) => idMap.get(oldId) || null;

  // ---- products -----------------------------------------------------------
  if (db.products.length) {
    const rows = db.products.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description || "",
      image_url: p.image_url || "",
      video_url: p.video_url || "",
      video_path: p.video_path || "",
      cost_price: p.cost_price,
      margin_percent: p.margin_percent,
      min_price: p.min_price,
      current_highest_bid: p.current_highest_bid,
      highest_bidder_id: uid(p.highest_bidder_id),
      bid_increment: p.bid_increment,
      start_time: p.start_time,
      end_time: p.end_time,
      status: p.status,
      created_at: p.created_at,
    }));
    const { error } = await supabase.from("products").upsert(rows);
    if (error) die(`products: ${error.message}`);
    console.log(`  + ${rows.length} products`);
  }

  // ---- the rest -----------------------------------------------------------
  const tables = [
    ["bids", db.bids, (b) => ({
      id: b.id, product_id: b.product_id, user_id: uid(b.user_id),
      bidder_name: b.bidder_name, amount: b.amount, created_at: b.created_at,
    })],
    ["orders", db.orders, (o) => ({
      id: o.id, product_id: o.product_id, user_id: uid(o.user_id), final_price: o.final_price,
      payment_status: o.payment_status, order_status: o.order_status, created_at: o.created_at,
    })],
    ["comments", db.comments, (c) => ({
      id: c.id, product_id: c.product_id, user_id: uid(c.user_id), author_name: c.author_name,
      body: c.body, image_url: c.image_url || "", image_path: c.image_path || "", created_at: c.created_at,
    })],
    ["requests", db.requests, (r) => ({
      id: r.id, user_id: uid(r.user_id), user_name: r.user_name, title: r.title, note: r.note,
      image_url: r.image_url || "", image_path: r.image_path || "", status: r.status, created_at: r.created_at,
    })],
  ];

  for (const [name, rowsIn, map] of tables) {
    const rows = (rowsIn || []).map(map).filter((r) => r.user_id);
    if (!rows.length) { console.log(`  · ${name}: nothing to migrate`); continue; }
    const { error } = await supabase.from(name).upsert(rows);
    if (error) die(`${name}: ${error.message}`);
    console.log(`  + ${rows.length} ${name}`);
  }

  // Identity sequences still start at 1 after explicit-id inserts, which would
  // collide on the next insert. Push each one past the highest id we wrote.
  const { error: seqError } = await supabase.rpc("resync_identity_sequences");
  if (seqError) {
    console.log(
      `\n  ! Could not resync id sequences automatically (${seqError.message}).` +
      `\n    Run this once in the SQL Editor:\n` +
      `\n    select setval(pg_get_serial_sequence('public.products','id'), coalesce((select max(id) from public.products),0)+1, false);` +
      `\n    select setval(pg_get_serial_sequence('public.bids','id'),     coalesce((select max(id) from public.bids),0)+1, false);` +
      `\n    select setval(pg_get_serial_sequence('public.orders','id'),   coalesce((select max(id) from public.orders),0)+1, false);` +
      `\n    select setval(pg_get_serial_sequence('public.comments','id'), coalesce((select max(id) from public.comments),0)+1, false);` +
      `\n    select setval(pg_get_serial_sequence('public.requests','id'), coalesce((select max(id) from public.requests),0)+1, false);\n`
    );
  } else {
    console.log("  + id sequences resynced");
  }

  console.log("\nDone. data/db.json is untouched — keep it as a backup.\n");
  console.log("Check the Supabase dashboard: Authentication → Users, and Table Editor → products.\n");
}

main().catch((err) => {
  console.error("\nUnexpected error:", err.message, "\n");
  process.exit(1);
});
