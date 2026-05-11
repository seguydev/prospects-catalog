import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

export type Prospect = {
  id: string;
  numero: number | null;
  date_envoi: string | null;
  prenom: string;
  nom: string | null;
  poste: string | null;
  societe: string | null;
  zone_geographique: string | null;
  niveau_relation: string | null;
  angle_message: string | null;
  message_envoye: string | null;
  connexion_acceptee: string | null;
  date_acceptation: string | null;
  date_followup_prevue: string | null;
  followup_envoye: boolean;
  reponse: string | null;
  type_reponse: string | null;
  rdv_programme: boolean;
  notes: string | null;
  source: string;
  created_at: string;
  updated_at: string;
};
