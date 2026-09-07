import { NextResponse } from "next/server";
import { closeExpiredAuctions } from "@/lib/db";

export async function GET(request, { params }) {
  const db = closeExpiredAuctions();
  const product = db.products.find((p) => p.id === Number(params.id));
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }
  const bids = db.bids
    .filter((b) => b.product_id === product.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return NextResponse.json({ product, bids });
}
