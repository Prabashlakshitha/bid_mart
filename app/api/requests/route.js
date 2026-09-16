import { NextResponse } from "next/server";
import { getRequests, createRequest } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isUploadedUrl, pathFromUploadedUrl } from "@/lib/uploads";
import { MAX_REQUEST_TITLE_LENGTH, MAX_REQUEST_NOTE_LENGTH } from "@/lib/rules";

/**
 * "I'm looking for this item" requests from customers.
 *
 * A customer describes goods they want us to source, optionally with a photo
 * of the sort of thing they mean. It lands straight in the admin queue at
 * /admin/requests — there's no public listing, since these are private
 * requests between one customer and the shop. Row level security (see
 * requests_select in supabase/schema.sql) is what actually scopes the list
 * below to "everything" for an admin and "just mine" for anyone else.
 */

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const requests = await getRequests();
  return NextResponse.json({ requests });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "You must be logged in to send a request." },
      { status: 401 }
    );
  }

  const { title, note, image_url } = await request.json();
  const cleanTitle = typeof title === "string" ? title.trim() : "";
  const cleanNote = typeof note === "string" ? note.trim() : "";

  if (!cleanTitle) {
    return NextResponse.json({ error: "Please say what item you're looking for." }, { status: 400 });
  }
  if (cleanTitle.length > MAX_REQUEST_TITLE_LENGTH) {
    return NextResponse.json(
      { error: `Keep the item name under ${MAX_REQUEST_TITLE_LENGTH} characters.` },
      { status: 400 }
    );
  }
  if (!cleanNote) {
    return NextResponse.json(
      { error: "Please add a note describing what you want." },
      { status: 400 }
    );
  }
  if (cleanNote.length > MAX_REQUEST_NOTE_LENGTH) {
    return NextResponse.json(
      { error: `Keep the note under ${MAX_REQUEST_NOTE_LENGTH} characters.` },
      { status: 400 }
    );
  }
  // The photo is optional, but anything attached must be a file we uploaded.
  if (image_url && !isUploadedUrl(image_url)) {
    return NextResponse.json(
      { error: "That photo wasn't uploaded through this site." },
      { status: 400 }
    );
  }

  const record = await createRequest({
    user_id: user.id,
    user_name: user.name,
    title: cleanTitle,
    note: cleanNote,
    image_url: image_url || "",
    image_path: image_url ? pathFromUploadedUrl(image_url) : "",
    status: "new",
  });

  return NextResponse.json({ request: record }, { status: 201 });
}
