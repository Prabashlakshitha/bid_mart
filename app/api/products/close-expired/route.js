import { NextResponse } from "next/server";
import { closeExpiredAuctions } from "@/lib/db";

// In production, point an external scheduler (e.g. cron-job.org, or a
// Vercel Cron Job) at this route every 1-5 minutes so auctions close on
// time even if no one is browsing the site. It's also called lazily from
// product read/bid routes so the demo stays correct without a scheduler.
export async function POST() {
  const db = closeExpiredAuctions();
  return NextResponse.json({ ok: true, productCount: db.products.length });
}

export async function GET() {
  const db = closeExpiredAuctions();
  return NextResponse.json({ ok: true, productCount: db.products.length });
}
