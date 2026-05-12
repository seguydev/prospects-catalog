import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase côté serveur (RSC, route handlers, server actions).
 * Lit/écrit la session dans les cookies.
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Appelé depuis un Server Component : ignoré (le middleware rafraîchira).
        }
      },
    },
  });
}

/**
 * Liste blanche des emails autorisés (un seul utilisateur attendu).
 * Définir ALLOWED_EMAILS="moi@exemple.com,autre@exemple.com" dans .env.local.
 */
export function allowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = allowedEmails();
  if (list.length === 0) return false; // fail-closed
  return list.includes(email.toLowerCase());
}

/**
 * Récupère l'utilisateur courant si et seulement si son email est autorisé.
 * Retourne null sinon. Utiliser dans les route handlers / server components protégés.
 */
export async function requireAllowedUser() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  if (!isEmailAllowed(data.user.email)) return null;
  return data.user;
}
