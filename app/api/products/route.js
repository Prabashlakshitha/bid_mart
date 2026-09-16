import { NextResponse } from "next/server";
import { getProducts, createProduct, computeMinPrice, closeExpiredAuctions } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isUploadedUrl, pathFromUploadedUrl } from "@/lib/uploads";

export async function GET() {
  await closeExpiredAuctions();
  const products = await getProducts();
  return NextResponse.json({ products });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = await request.json();
  const {
    title,
    description,
    image_url,
    video_url,
    cost_price,
    margin_percent,
    bid_increment,
    duration_hours,
  } = body;

  if (!title || !cost_price || !margin_percent || !duration_hours) {
    return NextResponse.json(
      { error: "Title, cost price, margin percent, and auction duration are required." },
      { status: 400 }
    );
  }
  if (Number(cost_price) <= 0 || Number(margin_percent) < 0) {
    return NextResponse.json({ error: "Cost price must be positive and margin cannot be negative." }, { status: 400 });
  }
  // The image may be any URL (admins can still paste a link), but a video is
  // only ever something we uploaded — there's no paste-a-link path for it.
  if (video_url && !isUploadedUrl(video_url)) {
    return NextResponse.json(
      { error: "That video wasn't uploaded through this site." },
      { status: 400 }
    );
  }

  const min_price = computeMinPrice(cost_price, margin_percent);
  const now = new Date();
  const end = new Date(now.getTime() + Number(duration_hours) * 60 * 60 * 1000);

  const product = await createProduct({
    title,
    description: description || "",
    image_url: image_url || "",
    video_url: video_url || "",
    video_path: video_url ? pathFromUploadedUrl(video_url) : "",
    cost_price: Number(cost_price),
    margin_percent: Number(margin_percent),
    min_price,
    bid_increment: Number(bid_increment) || Math.max(1, Math.round(min_price * 0.01)),
    start_time: now.toISOString(),
    end_time: end.toISOString(),
    status: "active",
    created_at: now.toISOString(),
  });

  return NextResponse.json({ product }, { status: 201 });
}
