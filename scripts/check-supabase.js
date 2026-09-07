/**
 * Verifies that Supabase Storage is wired up correctly.
 *
 *   npm run check:supabase
 *
 * Does a real round trip — uploads a tiny PNG, reads it back over the public
 * URL, then deletes it — so a pass means uploads will genuinely work in the
 * app, not just that the environment variables look plausible.
 */
const { loadEnvConfig } = require("@next/env");
const { createClient } = require("@supabase/supabase-js");

loadEnvConfig(process.cwd()); // reads .env.local the same way Next does

const RAW_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Mirrors normalizeProjectUrl() in lib/supabase.js — pasting the REST endpoint
// instead of the project URL is a common slip, and both forms work.
const URL = RAW_URL
  ? RAW_URL.trim().replace(/\/(rest|auth|storage|realtime)\/v\d+\/?$/i, "").replace(/\/+$/, "")
  : RAW_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "bidmart-images";

const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m, fix) => {
  console.log(`  ✗ ${m}`);
  if (fix) console.log(`\n    How to fix: ${fix}\n`);
};

function fail(message, fix) {
  bad(message, fix);
  console.log("Not connected yet. Fix the above, then run this again.\n");
  process.exit(1);
}

async function main() {
  console.log("\nChecking Supabase Storage setup\n");

  // --- 1. environment ----------------------------------------------------
  if (!URL) {
    fail(
      "NEXT_PUBLIC_SUPABASE_URL is not set",
      "Open .env.local and paste your Project URL (Supabase -> Project Settings -> Data API)."
    );
  }
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(URL)) {
    fail(
      `NEXT_PUBLIC_SUPABASE_URL does not look like a project URL: ${URL}`,
      "It should look like https://abcdefghijklm.supabase.co with nothing after the domain."
    );
  }
  ok(`Project URL: ${URL}`);
  if (URL !== RAW_URL.trim()) {
    console.log(`    (trimmed "${RAW_URL.trim()}" down to the project origin — both forms work)`);
  }

  if (!KEY) {
    fail(
      "SUPABASE_SERVICE_ROLE_KEY is not set",
      "Supabase -> Project Settings -> API Keys -> service_role -> Reveal, then paste it into .env.local."
    );
  }
  if (KEY.length < 40) {
    fail("SUPABASE_SERVICE_ROLE_KEY looks too short to be a real key", "Re-copy the whole service_role key.");
  }
  // The anon key is the usual mix-up, and it can't write to storage.
  try {
    const claims = JSON.parse(Buffer.from(KEY.split(".")[1], "base64").toString());
    if (claims.role && claims.role !== "service_role") {
      fail(
        `That key is the "${claims.role}" key, not the service_role key`,
        "In Project Settings -> API Keys, copy the key labelled service_role (you have to click Reveal)."
      );
    }
    ok("Key is the service_role key");
  } catch {
    ok("Service role key present"); // newer non-JWT key formats: let the API decide
  }

  // --- 2. bucket ---------------------------------------------------------
  const supabase = createClient(URL, KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    fail(
      `Could not reach Supabase Storage: ${listError.message}`,
      "Check the Project URL and service_role key are from the same project, and that you're online."
    );
  }
  ok("Connected to Supabase");

  const bucket = buckets.find((b) => b.name === BUCKET);
  if (!bucket) {
    const names = buckets.map((b) => b.name).join(", ") || "(none)";
    fail(
      `Bucket "${BUCKET}" does not exist. Buckets found: ${names}`,
      `Supabase -> Storage -> New bucket, name it exactly "${BUCKET}", and turn Public bucket ON.`
    );
  }
  ok(`Bucket "${BUCKET}" exists`);

  if (!bucket.public) {
    fail(
      `Bucket "${BUCKET}" is private, so uploaded photos would not display`,
      `Supabase -> Storage -> ${BUCKET} -> bucket settings -> turn Public bucket ON.`
    );
  }
  ok("Bucket is public (photos will display)");

  // --- 3. real round trip ------------------------------------------------
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );
  const path = `_healthcheck/${Date.now()}-connection-test.png`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, png, { contentType: "image/png", upsert: false });
  if (uploadError) {
    fail(`Upload failed: ${uploadError.message}`, "Confirm the service_role key belongs to this same project.");
  }
  ok("Uploaded a test image");

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const res = await fetch(pub.publicUrl);
  if (!res.ok) {
    fail(
      `Uploaded file is not publicly readable (HTTP ${res.status})`,
      `Supabase -> Storage -> ${BUCKET} -> bucket settings -> turn Public bucket ON.`
    );
  }
  ok("Test image is publicly readable");

  const { error: removeError } = await supabase.storage.from(BUCKET).remove([path]);
  if (removeError) bad(`Could not delete the test file at ${path} (harmless, delete it by hand)`);
  else ok("Cleaned up the test image");

  console.log("\nAll good — Supabase Storage is connected.\n");
  console.log("Restart the server (finish.bat then start.bat) and you'll get:");
  console.log("  - a file picker on Admin -> Add a lot");
  console.log("  - photo attachments on Buyer photos & comments\n");
}

main().catch((err) => {
  console.error("\nUnexpected error:", err.message, "\n");
  process.exit(1);
});
