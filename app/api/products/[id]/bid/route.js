import { NextResponse } from "next/server";
import { placeBid } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to bid." }, { status: 401 });
  }

  const { id } = await params;
  const { amount } = await request.json();
  const bidAmount = Number(amount);

  if (!bidAmount || bidAmount <= 0) {
    return NextResponse.json({ error: "Enter a valid bid amount." }, { status: 400 });
  }

  try {
    // place_bid() locks the product row and re-checks the floor inside that
    // lock, so two bids arriving at the same instant can't both "win" — the
    // race the old data/db.json version was exposed to.
    const bid = await placeBid(Number(id), bidAmount);
    return NextResponse.json({ ok: true, bid });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 400 });
  }
}
