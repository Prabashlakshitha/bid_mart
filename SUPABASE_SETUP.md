# Connecting Supabase Storage (image uploads)

BidMart uses Supabase for **one job: storing uploaded image files.** Products,
bids, orders and comments still live in `data/db.json`. That means you get real
file uploads without migrating the database — see "Later: moving the database
too" at the bottom.

Two things use it:

- **Admin → Add a lot** — upload a product photo instead of pasting a URL.
- **Product page → Buyer photos & comments** — a logged-in buyer can post their
  own description of an item, optionally with their own photo.

Until you finish the steps below, both still work: the lot form falls back to
pasting an image URL, and the comment form accepts text without a photo. Nothing
crashes if Supabase isn't configured.

---

## 1. Create the project

1. Go to [supabase.com](https://supabase.com) and sign in (the free tier is
   plenty for this).
2. **New project** → give it a name, set a database password, pick the region
   closest to your users.
3. Wait ~2 minutes for it to finish provisioning.

## 2. Create the storage bucket

1. In the left sidebar: **Storage** → **New bucket**.
2. Name it exactly `bidmart-images`.
3. Turn **Public bucket ON**. This is what lets `<img src="…">` load the photos
   on your pages without signed URLs.
4. Create it.

Optional but recommended — set the bucket's own limits as a second line of
defence. **SQL Editor** → paste and run:

```sql
update storage.buckets
set file_size_limit  = 5242880,   -- 5 MB, matches lib/rules.js
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
where id = 'bidmart-images';
```

You do **not** need to write any row-level-security policies. Uploads go through
this app's own API routes using the service role key, so the only rule that
matters is the public-read you enabled in step 3.

## 3. Copy your keys into `.env.local`

1. In the project root, copy the template:

   ```bash
   copy .env.local.example .env.local     # Windows
   # cp .env.local.example .env.local     # macOS / Linux
   ```

2. In the Supabase dashboard, go to **Project Settings** (gear icon):
   - **Data API** → copy **Project URL** → paste as `NEXT_PUBLIC_SUPABASE_URL`
   - **API Keys** → reveal and copy the **`service_role`** key → paste as
     `SUPABASE_SERVICE_ROLE_KEY`
3. Set `SESSION_SECRET` to any long random string while you're in there.

> **The `service_role` key is a full-access admin key.** It stays on the server
> only. Never rename it to `NEXT_PUBLIC_…`, never commit `.env.local`, and if it
> ever leaks, rotate it in **Project Settings → API Keys**.
>
> The `anon` key is *not* used by this project, because uploads are authorised by
> BidMart's own login cookie rather than by Supabase Auth.

## 4. Check the connection

```bash
npm run check:supabase
```

This does a real round trip — uploads a tiny test image, reads it back over its
public URL, then deletes it — so a pass means uploads genuinely work. If
something's wrong it names the exact fix (wrong key, missing bucket, bucket not
public). Re-run it until every line is a ✓.

## 5. Restart and use it

```bash
npm run dev
```

Next.js only reads `.env.local` at startup, so a restart is required. (If you
launch with `start.bat`, run `finish.bat` first.)

1. Log in as admin (`admin@bidmart.test` / `admin123`) → **Admin → Add a lot**.
   The Image URL box is now a **Product photo** file picker. Choose a JPG — it
   uploads immediately and shows a preview. Publish, then check the home page.
2. Log in as the buyer (`buyer@bidmart.test` / `buyer123`) → open any lot →
   scroll to **Buyer photos & comments**. Write a description, attach a photo,
   post it.
3. Back in Supabase → **Storage** → `bidmart-images`, you'll see the files under
   `lots/` and `comments/`.

---

## How it works

```
browser  ──file──>  POST /api/uploads  ──>  Supabase Storage
                          │                       │
                    checks session           returns public URL
                    + admin role                  │
                          └──── URL ──────────────┘
                                 │
                                 └──> saved on the product / comment
                                      record in data/db.json
```

| File | Role |
|---|---|
| [scripts/check-supabase.js](scripts/check-supabase.js) | `npm run check:supabase` — verifies the setup with a real upload round trip |
| [lib/supabase.js](lib/supabase.js) | Server-only Supabase client; `isStorageConfigured()` drives the UI fallbacks |
| [lib/uploads.js](lib/uploads.js) | Validates and uploads a file; verifies an image URL is really ours |
| [lib/rules.js](lib/rules.js) | Size / type / length limits shared by browser and server |
| [app/api/uploads/route.js](app/api/uploads/route.js) | The only upload entry point; maps `kind` to a folder and checks permissions |
| [app/api/products/[id]/comments/route.js](app/api/products/[id]/comments/route.js) | List and post buyer comments |
| [app/api/comments/[id]/route.js](app/api/comments/[id]/route.js) | Delete a comment (author or admin) |
| [components/ImageUploadField.js](components/ImageUploadField.js) | The file picker + preview, used by both forms |
| [components/ProductComments.js](components/ProductComments.js) | The buyer photos & comments section |

Design notes worth knowing:

- **The browser never holds a Supabase key.** Every upload goes through
  `/api/uploads`, which reuses the existing cookie session. `kind=lot` requires
  an admin; `kind=comment` requires any logged-in user.
- **The file's actual bytes decide its type.** `lib/uploads.js` checks the file
  signature rather than trusting the browser's `Content-Type`, and stores files
  under random names, so a hostile filename or a mislabelled file can't do
  anything interesting.
- **Comment photos must be files we uploaded.** The server rejects an
  `image_url` that doesn't start with your own bucket's public URL, so nobody can
  attach an arbitrary third-party image to a lot.
- **Deleting a comment deletes its photo** from the bucket too.

## Known gaps

- **Abandoned uploads leak files.** The photo uploads as soon as it's picked, so
  if someone attaches a photo and never submits the form, the file stays in the
  bucket unreferenced. Harmless at this scale; a scheduled sweep comparing
  bucket contents against `db.json` would clean it up.
- **Comments are not moderated.** They appear immediately. Admins can delete
  any comment, but there's no approval queue and no rate limit, so a public
  launch wants at least one of those.
- **No image resizing.** A 5 MB photo is served at 5 MB. Supabase's image
  transformation API (or `next/image`) would fix this.

## Later: moving the database too

`data/db.json` is still the database. When you outgrow it, the migration is
contained to [lib/db.js](lib/db.js) — create `users`, `products`, `bids`,
`orders` and `comments` tables in the same Supabase project's Postgres and
rewrite `readDb`/`writeDb` against them. The pages and components read plain
objects, so they don't change. The storage setup above stays exactly as it is.
