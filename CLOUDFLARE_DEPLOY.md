# Deploying to Cloudflare Workers

BidMart deploys as a Cloudflare Worker via the OpenNext adapter
(`@opennextjs/cloudflare`), which converts the Next.js build into something
Workers can run. This doc captures everything that had to be fixed to get
there — each one failed silently or with a confusing error, so it's worth
knowing about before it happens to you again.

## One-time setup checklist

1. **Worker name must match `wrangler.jsonc`.** OpenNext adds a
   `WORKER_SELF_REFERENCE` binding built from the `name` field in
   [wrangler.jsonc](wrangler.jsonc). If the Worker you deploy to has a
   different name, deploy fails with *"Service binding 'WORKER_SELF_REFERENCE'
   references Worker 'x' which was not found."*
2. **Deploy command must be `npm run deploy`**, not `npx wrangler deploy`
   directly. `npm run build` only produces `.next/`; the Worker needs
   `.open-next/worker.js`, which only exists after running
   `opennextjs-cloudflare build` first. `npm run deploy` runs both steps.
3. **Environment variables — one screen, but two different lifetimes.**
   Cloudflare Workers Builds exposes whatever you set in
   **Settings → Variables and Secrets** to both the build step and the
   running Worker, but that only takes effect on the *next* build. Adding a
   variable does not retroactively fix an already-deployed version — you
   still need a fresh deploy afterward (see below).

   Required:
   | Name | Encrypt? |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | no |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | no — this key is meant to be public |
   | `SUPABASE_SERVICE_ROLE_KEY` | **yes** — full admin access to the database |
   | `SUPABASE_STORAGE_BUCKET` | no (optional — defaults to `bidmart-images`) |

   The two `NEXT_PUBLIC_*` values get compiled directly into the JavaScript
   at build time. If they're missing when the build runs, the code ships with
   the literal string `"undefined"` in their place — every page that touches
   Supabase (which is almost every page) then fails on every single request,
   since the client library can't do anything with `undefined` as a URL.
4. **After changing variables, trigger a new build.** Push any commit to the
   connected branch, or use the dashboard's redeploy/retry action if one is
   available. Check **Deployments** afterward for a new entry, and confirm
   the *live* one is the one you expect — comparing `scriptVersion.id` in the
   Observability logs is a reliable way to tell whether a change actually
   went live.

## Why the app needed a Supabase rewrite before any of this mattered

Cloudflare Workers have no writable filesystem. The original prototype stored
everything in `data/db.json` via Node's `fs` module, which throws
`Error: operation not permitted` on every read/write in the Workers runtime —
confirmed by running the built Worker locally in `workerd`
(`npx wrangler dev --local`) before ever deploying it for real. That's why
`lib/db.js` now talks to Supabase Postgres instead — see
[SUPABASE_SETUP.md](SUPABASE_SETUP.md) for that side of things.

## Durable Object bindings

`wrangler.jsonc` binds three Durable Object classes
(`BucketCachePurge`, `DOQueueHandler`, `DOShardedTagCache`) that OpenNext's
build always exports, whether or not the app uses them. BidMart doesn't —
every route is `force-dynamic`, so there's no incremental cache for them to
back — but binding them is harmless (a Durable Object is only "live" if
something calls it) and it's what Cloudflare's own tooling suggested when
diagnosing an unrelated error, so it's committed for completeness. The
`migrations` block with `new_sqlite_classes` is required the first time you
bind a Durable Object class at all — omitting it fails the deploy outright.

## Diagnosing a live 500

The generic "This page couldn't load" screen a browser shows tells you
nothing — it's a browser-generated placeholder, not a Cloudflare or Supabase
error code. To see the real cause:

**Workers & Pages → your Worker → Observability** — find an `error`-level row
around the time of the failing request and expand it. Look for a `message`
field with an actual exception name (`TypeError: …`, `AuthApiError: …`) —
not just stack frames, which only show *where* something failed, not *what*
failed. `"outcome": "ok"` alongside a `500` status means the Worker itself
didn't crash — something inside the app (usually a Server Component) threw,
and Next.js's own error boundary caught it and rendered a generic error page.
