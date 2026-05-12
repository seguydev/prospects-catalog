import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = ["/login", "/auth/callback", "/auth/signout"];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  // Assets Next.js, favicon, etc. (le matcher ci-dessous les exclut déjà, ceinture + bretelles).
  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") return true;
  return false;
}

function allowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            res.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Rafraîchit la session si possible.
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const pathname = req.nextUrl.pathname;

  if (isPublic(pathname)) return res;

  // Pas connecté → redirige vers /login
  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Allowlist email : un seul utilisateur (toi)
  const list = allowedEmails();
  const email = user.email?.toLowerCase();
  if (list.length === 0 || !email || !list.includes(email)) {
    // Force la déconnexion et renvoie sur /login avec une erreur.
    await supabase.auth.signOut();
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "forbidden");
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  // Exclut les assets statiques et la route d'API _next.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
