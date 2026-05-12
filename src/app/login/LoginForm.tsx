"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(
    initialError === "forbidden" ? "Cet email n'est pas autorisé." : null,
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        // shouldCreateUser:false → empêche tout nouvel utilisateur ;
        // seuls les emails déjà créés dans Supabase Auth peuvent recevoir le lien.
        shouldCreateUser: false,
      },
    });

    if (err) {
      setStatus("error");
      setError(err.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
          placeholder="toi@exemple.com"
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading" || status === "sent"}
        className="w-full rounded bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 py-2 text-sm font-medium disabled:opacity-50"
      >
        {status === "loading" ? "Envoi…" : status === "sent" ? "Lien envoyé" : "Recevoir un lien magique"}
      </button>

      {status === "sent" ? (
        <p className="text-sm text-green-700 dark:text-green-300">
          Vérifie ta boîte mail et clique sur le lien pour te connecter.
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
      ) : null}
    </form>
  );
}
