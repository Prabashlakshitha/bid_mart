import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * Converts the Next.js build into a Cloudflare Worker.
 *
 * Defaults are fine here: BidMart renders every route on demand
 * (`export const dynamic = "force-dynamic"`), so there is no incremental
 * cache to configure. If static caching is added later, see
 * https://opennext.js.org/cloudflare/caching
 */
export default defineCloudflareConfig();
