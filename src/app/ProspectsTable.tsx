"use client";

import { useMemo, useState, useTransition } from "react";
import type { Prospect } from "@/lib/supabase";

type EditableField = keyof Omit<
  Prospect,
  "id" | "created_at" | "updated_at" | "source" | "numero"
>;

const COLUMNS: { key: keyof Prospect; label: string; editable: boolean; type?: "text" | "date" | "bool" | "select"; options?: string[]; long?: boolean }[] = [
  { key: "numero", label: "#", editable: false },
  { key: "date_envoi", label: "Date envoi", editable: true, type: "date" },
  { key: "prenom", label: "Prénom", editable: true, type: "text" },
  { key: "nom", label: "Nom", editable: true, type: "text" },
  { key: "poste", label: "Poste", editable: true, type: "text" },
  { key: "societe", label: "Société", editable: true, type: "text" },
  { key: "zone_geographique", label: "Zone", editable: true, type: "text" },
  { key: "niveau_relation", label: "Relation", editable: true, type: "select", options: ["", "1er", "2e", "3e"] },
  { key: "angle_message", label: "Angle", editable: true, type: "text" },
  { key: "connexion_acceptee", label: "Acceptée", editable: true, type: "select", options: ["", "OUI", "NON", "À compléter"] },
  { key: "date_acceptation", label: "Date acc.", editable: true, type: "date" },
  { key: "date_followup_prevue", label: "Follow-up", editable: true, type: "date" },
  { key: "followup_envoye", label: "F-up envoyé", editable: true, type: "bool" },
  { key: "type_reponse", label: "Type réponse", editable: true, type: "text" },
  { key: "rdv_programme", label: "RDV", editable: true, type: "bool" },
  { key: "notes", label: "Notes", editable: true, type: "text", long: true },
];

export function ProspectsTable({ initial }: { initial: Prospect[] }) {
  const [rows, setRows] = useState<Prospect[]>(initial);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Unique values pour les colonnes select
  const uniqueValues = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const r of rows) {
      for (const c of COLUMNS) {
        const v = r[c.key];
        if (v == null) continue;
        const s = String(v);
        if (!map[c.key]) map[c.key] = new Set();
        map[c.key].add(s);
      }
    }
    return map;
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      for (const [k, q] of Object.entries(filters)) {
        if (!q) continue;
        const v = (r as Record<string, unknown>)[k];
        const sv = v == null ? "" : String(v).toLowerCase();
        if (!sv.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, filters]);

  async function save(id: string, field: EditableField, value: unknown) {
    setError(null);
    const prev = rows;
    // Optimistic update
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    try {
      const res = await fetch(`/api/prospects/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const { data } = await res.json();
      setRows((rs) => rs.map((r) => (r.id === id ? (data as Prospect) : r)));
    } catch (e) {
      setRows(prev);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
          Erreur : {error}
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-neutral-500">
        <span>{filtered.length} / {rows.length} affichés</span>
        {Object.values(filters).some(Boolean) && (
          <button
            onClick={() => setFilters({})}
            className="px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Réinitialiser filtres
          </button>
        )}
        {pending && <span>Enregistrement…</span>}
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-100 dark:bg-neutral-900 text-left sticky top-0">
            <tr>
              {COLUMNS.map((c) => (
                <th key={c.key as string} className="px-3 py-2 font-semibold text-xs uppercase tracking-wide whitespace-nowrap">
                  {c.label}
                </th>
              ))}
            </tr>
            <tr className="bg-neutral-50 dark:bg-neutral-950">
              {COLUMNS.map((c) => {
                const opts = c.type === "select" || c.type === "bool"
                  ? c.options ?? Array.from(uniqueValues[c.key as string] ?? []).sort()
                  : null;
                return (
                  <th key={`f-${c.key as string}`} className="px-2 py-1">
                    {opts ? (
                      <select
                        className="w-full bg-transparent border border-neutral-300 dark:border-neutral-700 rounded px-1 py-0.5 text-xs"
                        value={filters[c.key as string] ?? ""}
                        onChange={(e) => setFilters((f) => ({ ...f, [c.key]: e.target.value }))}
                      >
                        <option value="">—</option>
                        {opts.map((o) => (
                          <option key={o} value={o}>{o || "(vide)"}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="filtre…"
                        className="w-full bg-transparent border border-neutral-300 dark:border-neutral-700 rounded px-1 py-0.5 text-xs"
                        value={filters[c.key as string] ?? ""}
                        onChange={(e) => setFilters((f) => ({ ...f, [c.key]: e.target.value }))}
                      />
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-neutral-200 dark:border-neutral-800 align-top hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                {COLUMNS.map((c) => (
                  <td key={c.key as string} className="px-3 py-2">
                    <Cell
                      row={r}
                      col={c}
                      onSave={(val) => startTransition(() => save(r.id, c.key as EditableField, val))}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Cell({
  row,
  col,
  onSave,
}: {
  row: Prospect;
  col: (typeof COLUMNS)[number];
  onSave: (v: unknown) => void;
}) {
  const v = row[col.key];
  if (!col.editable) {
    return <span className="font-mono text-xs">{v == null ? "—" : String(v)}</span>;
  }

  if (col.type === "bool") {
    return (
      <input
        type="checkbox"
        checked={Boolean(v)}
        onChange={(e) => onSave(e.target.checked)}
      />
    );
  }

  if (col.type === "select") {
    return (
      <select
        className="bg-transparent border border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 rounded px-1 py-0.5 text-xs"
        value={v == null ? "" : String(v)}
        onChange={(e) => onSave(e.target.value || null)}
      >
        {(col.options ?? []).map((o) => (
          <option key={o} value={o}>{o || "(vide)"}</option>
        ))}
      </select>
    );
  }

  if (col.type === "date") {
    const dateStr = typeof v === "string" ? v.slice(0, 10) : "";
    return (
      <input
        type="date"
        className="bg-transparent border border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 rounded px-1 py-0.5 text-xs"
        defaultValue={dateStr}
        onBlur={(e) => {
          const next = e.target.value || null;
          if (next !== dateStr) onSave(next);
        }}
      />
    );
  }

  // text (inline editable)
  const text = v == null ? "" : String(v);
  return (
    <span
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => {
        const next = e.currentTarget.textContent ?? "";
        if (next !== text) onSave(next);
      }}
      className={`block outline-none rounded px-1 py-0.5 focus:ring-1 focus:ring-blue-400 ${
        col.long ? "max-w-xs whitespace-pre-wrap" : "whitespace-nowrap"
      } ${text ? "" : "text-neutral-400 italic"}`}
    >
      {text || "—"}
    </span>
  );
}
