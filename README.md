# BidMart — Timed Auction Marketplace (Prototype)

A working local prototype of your bidding e-commerce site. Payment is
intentionally **not connected yet** — every "Pay now" button is disabled
with a note, ready for PayHere to be wired in next.

## What's included

- **Home page** — grid of latest/active auctions with live countdown timers
- **Product page** — bid form, live bid history, auto-closes when the timer ends
- **Admin dashboard** — add a lot with **cost price + profit margin %**, the
  starting (minimum) price is calculated automatically
- **Real image uploads** — admins upload a lot photo from their machine
  (Supabase Storage). Falls back to pasting an image URL if Supabase isn't
  configured, so the site runs with zero setup
- **Buyer photos & comments** — a logged-in buyer can post their own
  description of an item plus their own photo of it; authors and admins can
  delete a comment
- **Auth** — register/login for buyers, a seeded admin account
- **Orders page** — shows won auctions "awaiting payment" once an auction ends
- **Auto-close logic** — when an auction's timer expires, the highest bidder
  automatically wins and an order is created (checked whenever pages load;
  see note on cron below for production)

## Tech used (all beginner-friendly, nothing to configure)

- **Next.js 14** (App Router) — one framework for frontend + backend
- **A local JSON file as the database** (`data/db.json`) — no database server
  to install or configure. Good enough to develop and demo with; swap for
  Supabase/Postgres later without changing much of the page code.
- **Tailwind CSS** for styling
- **bcryptjs** for password hashing, a simple signed cookie for sessions
  (no third-party auth service required)
- **Supabase Storage** for uploaded image files only — optional, and the one
  external service in the project. See [SUPABASE_SETUP.md](SUPABASE_SETUP.md).

## How to run it

```bash
npm install
npm run seed      # creates the database with demo accounts + sample lots
npm run dev        # starts the site at http://localhost:3000
```

Optional, for photo uploads:

```bash
npm run check:supabase   # verifies your Supabase Storage setup with a real upload
```

That's everything needed to run the site. To turn on **photo uploads**, do the
one-time Supabase setup in [SUPABASE_SETUP.md](SUPABASE_SETUP.md) (copy
`.env.local.example` to `.env.local`, create a public storage bucket, paste two
keys). Skip it and image fields fall back to pasting a URL.

Demo accounts (created by `npm run seed`):
- **Admin:** admin@bidmart.test / admin123
- **Buyer:** buyer@bidmart.test / buyer123

To reset all data back to the sample lots at any point, just run
`npm run seed` again — it overwrites `data/db.json`.

## Try it out

1. Visit `http://localhost:3000` — you'll see 3 sample lots with live countdowns.
2. Log in as the buyer, open a lot, place a bid above the minimum.
3. Log in as admin (`/admin`) — add a new lot: enter a cost price and margin %,
   watch the minimum price calculate live, set a duration, publish.
4. To see an auction close automatically: edit `data/db.json`, set a
   product's `end_time` to a past date, then reload the home page — it will
   flip to "Sold" and create an order (visible under **Admin → Orders**).

## What's next (not built yet, on purpose)

- **Payment gateway (PayHere)** — the "Pay now" button on the Orders page is
  wired up in the UI but disabled. Once you're ready, this is where we'll
  add the PayHere checkout session + webhook to confirm payment.
- **Real scheduler for auction closing** — right now auctions close lazily
  whenever someone loads a page that reads product data (works fine for a
  demo/low-traffic site). For production, point an external scheduler (e.g.
  a free cron at cron-job.org, or a Vercel Cron Job) at
  `POST /api/products/close-expired` every 1–5 minutes so lots close on time
  even with nobody browsing.
- **Real database** — `data/db.json` is fine for development, but isn't safe
  for concurrent production traffic. Swapping in Supabase/Postgres later is
  a matter of rewriting `lib/db.js`; none of the page/component code needs
  to change. (Image *files* already live in Supabase Storage — only the
  records are still local.)
- **Comment moderation** — buyer comments appear immediately, with no approval
  queue and no rate limit. Admins can delete any comment, which is enough for a
  demo but not for a public launch.

## Known trade-offs (worth knowing before deploying live)

- `npm audit` flags some Next.js 14.2.x advisories that matter for
  internet-facing production deployments (SSRF/cache-poisoning edge cases).
  Fine for local development; before a public launch, either upgrade to the
  latest Next.js major version or make sure these are patched.
- The session secret in `lib/auth.js` has a hardcoded fallback for local
  dev. Before deploying anywhere public, set a real `SESSION_SECRET`
  environment variable.
