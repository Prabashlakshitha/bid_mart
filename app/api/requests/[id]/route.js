import { NextResponse } from "next/server";
import { getRequestById, updateRequestStatus, deleteRequestById } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { deleteImage } from "@/lib/uploads";
import { REQUEST_STATUSES } from "@/lib/rules";

/** Admin moves a request through the queue: new -> reviewed -> closed. */
export async function PATCH(request, { params }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { status } = await request.json();
  if (!REQUEST_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Unknown status." }, { status: 400 });
  }

  const { id } = await params;
  const record = await updateRequestStatus(Number(id), status);
  if (!record) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  return NextResponse.json({ request: record });
}

/**
 * Either the customer who sent it or an admin can remove a request.
 *
 * Row level security means a non-owner can't even fetch someone else's
 * request (requests_select scopes reads to "mine or I'm an admin"), so a
 * stranger's request id 404s here rather than 403ing — it isn't visible to
 * them at all, which fits the "private request" design better than the old
 * data/db.json version could enforce.
 */
export async function DELETE(_request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const { id } = await params;
  const record = await getRequestById(Number(id));
  if (!record) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }
  if (record.user_id !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "You can only delete your own request." }, { status: 403 });
  }

  await deleteRequestById(record.id);
  await deleteImage(record.image_path);

  return NextResponse.json({ ok: true });
}
