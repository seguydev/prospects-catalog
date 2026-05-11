-- =====================================================================
-- Schéma : catalogue de prospects (LinkedIn & autres)
-- Cible : Supabase / Postgres
-- =====================================================================

create extension if not exists "pgcrypto";

create table if not exists public.prospects (
  id                    uuid primary key default gen_random_uuid(),
  numero                integer unique,                 -- N° d'ordre du tableau source
  date_envoi            date,                           -- Date d'envoi du message
  prenom                text not null,
  nom                   text,
  poste                 text,
  societe               text,
  zone_geographique     text,
  niveau_relation       text,                           -- "1er" | "2e" | "3e" | ...
  angle_message         text,                           -- Angle utilisé pour le 1er contact
  message_envoye        text,                           -- Extrait du message
  connexion_acceptee    text,                           -- "OUI" | "NON" | "À compléter"
  date_acceptation      date,
  date_followup_prevue  date,
  followup_envoye       boolean not null default false,
  reponse               text,                           -- Contenu / résumé de la réponse
  type_reponse          text,                           -- "positive" | "négative" | "neutre" | ...
  rdv_programme         boolean not null default false,
  notes                 text,                           -- Notes libres / actions
  source                text not null default 'linkedin',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists prospects_societe_idx        on public.prospects (societe);
create index if not exists prospects_niveau_idx         on public.prospects (niveau_relation);
create index if not exists prospects_date_envoi_idx     on public.prospects (date_envoi);
create index if not exists prospects_connexion_idx      on public.prospects (connexion_acceptee);

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_prospects_updated_at on public.prospects;
create trigger trg_prospects_updated_at
before update on public.prospects
for each row execute function public.set_updated_at();

-- =====================================================================
-- RLS : ouverte au service_role uniquement par défaut.
-- Pour autoriser l'app Next.js (anon) en lecture seule, décommenter.
-- =====================================================================
alter table public.prospects enable row level security;

drop policy if exists "prospects read for anon" on public.prospects;
create policy "prospects read for anon"
  on public.prospects for select
  to anon, authenticated
  using (true);

-- L'écriture passe uniquement par service_role (MCP / scripts).
