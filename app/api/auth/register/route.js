import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  const { name, email, password } = await request.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) {
    const status = /rate limit/i.test(error.message) ? 429 : /already registered/i.test(error.message) ? 409 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }

  // Supabase's anti-enumeration behaviour: signing up with an email that's
  // already confirmed returns success with no error, but an empty
  // `identities` array — this is the documented way to detect it.
  if (data.user && data.user.identities?.length === 0) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 }
    );
  }

  // With email confirmation on, signUp succeeds but returns no session until
  // the user clicks the link in their inbox.
  if (!data.session) {
    return NextResponse.json({ ok: true, needsConfirmation: true });
  }

  // createClient() already wrote the session cookie via its cookies.setAll.
  return NextResponse.json({ ok: true });
}
