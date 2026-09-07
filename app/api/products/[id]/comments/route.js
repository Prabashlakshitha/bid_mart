import { NextResponse } from "next/server";
import { readDb, writeDb, nextId } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isUploadedUrl, pathFromUploadedUrl } from "@/lib/uploads";
import { MAX_COMMENT_LENGTH } from "@/lib/rules";

/** Public: anyone can read what buyers have said about a lot. */
export async function GET(_request, { params }) {
  const db = readDb();
  const productId = Number(params.id);
  const comments = db.comments
    .filter((c) => c.product_id === productId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return NextResponse.json({ comments });
}

export async function POST(request, { params }) {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "You must be logged in to post a comment." },
      { status: 401 }
    );
  }

  const db = readDb();
  const product = db.products.find((p) => p.id === Number(params.id));
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const { body, image_url } = await request.json();
  const text = typeof body === "string" ? body.trim() : "";

  if (!text) {
    return NextResponse.json(
      { error: "Please write something about this item." },
      { status: 400 }
    );
  }
  if (text.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json(
      { error: `Comments are limited to ${MAX_COMMENT_LENGTH} characters.` },
      { status: 400 }
    );
  }
  // A photo is optional, but if one is attached it must be a file we uploaded.
  if (image_url && !isUploadedUrl(image_url)) {
    return NextResponse.json(
      { error: "That photo wasn't uploaded through this site." },
      { status: 400 }
    );
  }

  const comment = {
    id: nextId(db, "comments"),
    product_id: product.id,
    user_id: user.id,
    author_name: user.name,
    body: text,
    image_url: image_url || "",
    image_path: image_url ? pathFromUploadedUrl(image_url) : "",
    created_at: new Date().toISOString(),
  };

  db.comments.push(comment);
  writeDb(db);

  return NextResponse.json({ comment }, { status: 201 });
}
