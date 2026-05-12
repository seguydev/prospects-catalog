import { NextResponse } from "next/server";
import { getSupabaseServerClient, isEmailAllowed } from "@/lib/supabase-server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=exchange_failed", url.origin));
  }

  // Vérifie l'allowlist immédiatement après l'échange.
  const { data } = await supabase.auth.getUser();
  if (!isEmailAllowed(data.user?.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=forbidden", url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
