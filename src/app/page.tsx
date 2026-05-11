import { supabase, type Prospect } from "@/lib/supabase";
import { ProspectsTable } from "./ProspectsTable";

export const revalidate = 0;

export default async function Page() {
  const { data, error } = await supabase
    .from("prospects")
    .select("*")
    .order("numero", { ascending: true });

  const prospects = (data ?? []) as Prospect[];
  const total = prospects.length;
  const acceptes = prospects.filter((p) => p.connexion_acceptee === "OUI").length;
  const aSuivre = prospects.filter((p) => p.connexion_acceptee === "À compléter").length;
  const rdv = prospects.filter((p) => p.rdv_programme).length;

  return (
    <main className="max-w-[1600px] mx-auto p-6 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Catalogue prospects</h1>
          <p className="text-sm text-neutral-500">
            Édition inline • Filtres par colonne • Accessible à Claude via MCP Supabase.
          </p>
        </div>
        <div className="grid grid-cols-4 gap-3 text-center">
          <Stat label="Total" value={total} />
          <Stat label="Acceptés" value={acceptes} tone="green" />
          <Stat label="À vérifier" value={aSuivre} tone="amber" />
          <Stat label="RDV" value={rdv} tone="blue" />
        </div>
      </header>

      {error ? (
        <div className="rounded border border-red-300 bg-red-50 p-4 text-red-800 dark:bg-red-900/30 dark:text-red-200">
          Erreur Supabase : {error.message}
        </div>
      ) : null}

      <ProspectsTable initial={prospects} />

      <footer className="text-xs text-neutral-500">
        Astuce : clique dans une cellule pour modifier (Tab/clic ailleurs pour sauvegarder). Les filtres en haut de colonne se combinent.
      </footer>
    </main>
  );
}

function Stat({ label, value, tone = "neutral" }: { label: string; value: number; tone?: "green" | "amber" | "blue" | "neutral" }) {
  const tones = {
    green: "text-green-700 dark:text-green-300",
    amber: "text-amber-700 dark:text-amber-300",
    blue: "text-blue-700 dark:text-blue-300",
    neutral: "text-neutral-800 dark:text-neutral-100",
  } as const;
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 px-3 py-2 min-w-20">
      <div className={`text-xl font-bold ${tones[tone]}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-neutral-500">{label}</div>
    </div>
  );
}
