-- =====================================================================
-- Durcissement RLS : la table prospects n'est plus lisible par anon.
-- Seuls les utilisateurs authentifiés (cookie de session Supabase) lisent.
-- L'allowlist d'email applicative est en plus contrôlée côté Next.js
-- (middleware + requireAllowedUser), donc en pratique seul ton compte
-- voit les lignes via l'app. L'écriture reste réservée au service_role.
-- =====================================================================

alter table public.prospects enable row level security;

-- Supprime l'ancienne policy "lecture pour anon"
drop policy if exists "prospects read for anon" on public.prospects;

-- Nouvelle policy : lecture pour les utilisateurs authentifiés uniquement.
drop policy if exists "prospects read for authenticated" on public.prospects;
create policy "prospects read for authenticated"
  on public.prospects for select
  to authenticated
  using (true);

-- Révoque tout accès direct au rôle anon (ceinture + bretelles : la clé
-- anonyme exposée côté client ne peut plus lire la table même via REST).
revoke all on public.prospects from anon;
