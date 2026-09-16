import { NextResponse } from "next/server";
import { closeExpiredAuctions, getProductById, getBidsForProduct } from "@/lib/db";

export async function GET(_request, { params }) {
  const { id } = await params;
  await closeExpiredAuctions();

  const product = await getProductById(Number(id));
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }
  const bids = await getBidsForProduct(product.id);

  return NextResponse.json({ product, bids });
}
