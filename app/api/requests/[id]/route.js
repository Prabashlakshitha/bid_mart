import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { deleteImage } from "@/lib/uploads";
import { REQUEST_STATUSES } from "@/lib/rules";

/** Admin moves a request through the queue: new -> reviewed -> closed. */
export async function PATCH(request, { params }) {
  const user = getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { status } = await request.json();
  if (!REQUEST_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Unknown status." }, { status: 400 });
  }

  const db = readDb();
  const record = db.requests.find((r) => r.id === Number(params.id));
  if (!record) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  record.status = status;
  writeDb(db);

  return NextResponse.json({ request: record });
}

/** Either the customer who sent it or an admin can remove a request. */
export async function DELETE(_request, { params }) {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const db = readDb();
  const index = db.requests.findIndex((r) => r.id === Number(params.id));
  if (index === -1) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  const record = db.requests[index];
  if (record.user_id !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "You can only delete your own request." }, { status: 403 });
  }

  db.requests.splice(index, 1);
  writeDb(db);

  await deleteImage(record.image_path);

  return NextResponse.json({ ok: true });
}
