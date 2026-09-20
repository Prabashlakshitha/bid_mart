import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Auth Code එක මගින් Session එක exchange කරගැනීම
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Login වුණාට පස්සේ User ව යවන්න ඕන Page එක (උදා: Main Page එකට හෝ Dashboard එකට)
  return NextResponse.redirect(requestUrl.origin);
}
