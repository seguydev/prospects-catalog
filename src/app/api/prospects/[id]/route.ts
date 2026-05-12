import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAllowedUser } from "@/lib/supabase-server";

// Liste blanche des colonnes modifiables (évite injection arbitraire).
const EDITABLE = new Set([
  "date_envoi",
  "prenom",
  "nom",
  "poste",
  "societe",
  "zone_geographique",
  "niveau_relation",
  "angle_message",
  "message_envoye",
  "connexion_acceptee",
  "date_acceptation",
  "date_followup_prevue",
  "followup_envoye",
  "reponse",
  "type_reponse",
  "rdv_programme",
  "notes",
]);

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAllowedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!EDITABLE.has(k)) continue;
    patch[k] = v === "" ? null : v;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No editable fields" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from("prospects")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
