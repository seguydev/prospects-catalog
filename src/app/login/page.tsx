import { LoginForm } from "./LoginForm";

export const metadata = { title: "Connexion — Prospects Catalog" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next = "/", error } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-bold">Connexion</h1>
          <p className="text-sm text-neutral-500">
            Accès restreint. Saisis ton email pour recevoir un lien magique.
          </p>
        </div>
        <LoginForm next={next} initialError={error} />
      </div>
    </main>
  );
}
