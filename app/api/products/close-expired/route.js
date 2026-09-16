import { NextResponse } from "next/server";
import { closeExpiredAuctions, getProducts } from "@/lib/db";

// In production, point an external scheduler (e.g. cron-job.org, or a
// Vercel Cron Job) at this route every 1-5 minutes so auctions close on
// time even if no one is browsing. It's also called lazily from product
// read/bid routes so the site stays correct without a scheduler.
export async function POST() {
  await closeExpiredAuctions();
  const products = await getProducts();
  return NextResponse.json({ ok: true, productCount: products.length });
}

export async function GET() {
  await closeExpiredAuctions();
  const products = await getProducts();
  return NextResponse.json({ ok: true, productCount: products.length });
}
