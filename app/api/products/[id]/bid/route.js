import { NextResponse } from "next/server";
import { readDb, writeDb, nextId, closeExpiredAuctions } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request, { params }) {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to bid." }, { status: 401 });
  }

  // Lazily close any auctions that expired since the last read.
  closeExpiredAuctions();
  const db = readDb();

  const product = db.products.find((p) => p.id === Number(params.id));
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }
  if (product.status !== "active") {
    return NextResponse.json({ error: "This auction has already ended." }, { status: 409 });
  }
  if (new Date(product.end_time).getTime() <= Date.now()) {
    return NextResponse.json({ error: "This auction has already ended." }, { status: 409 });
  }

  const { amount } = await request.json();
  const bidAmount = Number(amount);

  const floor = product.current_highest_bid
    ? product.current_highest_bid + product.bid_increment
    : product.min_price;

  if (!bidAmount || bidAmount < floor) {
    return NextResponse.json(
      { error: `Bid must be at least Rs. ${floor.toLocaleString()}.` },
      { status: 400 }
    );
  }

  // Server is the source of truth for price — never trust a client-sent final price later at checkout.
  product.current_highest_bid = bidAmount;
  product.highest_bidder_id = user.id;

  const bid = {
    id: nextId(db, "bids"),
    product_id: product.id,
    user_id: user.id,
    bidder_name: user.name,
    amount: bidAmount,
    created_at: new Date().toISOString(),
  };
  db.bids.push(bid);
  writeDb(db);

  return NextResponse.json({ ok: true, product, bid });
}
