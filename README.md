# Prospects Catalog

Catalogue de prospects LinkedIn stocké sur **Supabase Postgres** et accessible à
**Claude** en lecture/écriture via le **MCP Supabase**. Petite UI Next.js en bonus
pour visualiser la table.

---

## 1. Installation

```bash
cd prospects-catalog
npm install
cp .env.example .env.local
# → renseigne YOUR-PASSWORD / ANON_KEY / SERVICE_ROLE_KEY
```

Récupère les clés ici : Supabase → ton projet → **Project Settings → API**.

---

## 2. Créer le schéma + seeder les 29 prospects

### Option A — via `psql`

```bash
# Requiert psql installé localement
$env:DATABASE_URL = "postgresql://postgres:MOT_DE_PASSE@db.ghoisutpgunmihjngzcu.supabase.co:5432/postgres"
psql $env:DATABASE_URL -f supabase/migrations/0001_init.sql
psql $env:DATABASE_URL -f supabase/seed.sql
```

### Option B — via le SQL Editor Supabase

Ouvre Supabase → **SQL Editor** → colle successivement :

1. `supabase/migrations/0001_init.sql`
2. `supabase/seed.sql`

### Option C — via Claude lui-même (MCP)

Une fois le MCP configuré (étape 3), tu peux demander à Claude :

> *« Applique la migration `supabase/migrations/0001_init.sql` puis le seed
> `supabase/seed.sql` sur ma base. »*

Claude utilisera l'outil `apply_migration` / `execute_sql` du MCP Supabase.

---

## 3. Configurer le MCP Supabase pour Claude

Le fichier [.mcp.json](.mcp.json) est déjà créé à la racine. Il déclare le MCP
Supabase en **scope projet** (transport HTTP) :

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=ghoisutpgunmihjngzcu"
    }
  }
}
```

Équivalent CLI (si tu veux le régénérer) :

```bash
claude mcp add --scope project --transport http supabase \
  "https://mcp.supabase.com/mcp?project_ref=ghoisutpgunmihjngzcu"
```

### Authentification (à faire une seule fois)

Dans un **vrai terminal** (pas l'extension VS Code) :

```bash
cd prospects-catalog
claude /mcp
```

→ sélectionne `supabase` → **Authenticate** → tu es redirigé vers Supabase pour
autoriser l'accès au projet `ghoisutpgunmihjngzcu`.

### (Optionnel) Agent Skills Supabase

```bash
npx skills add supabase/agent-skills
```

Ça installe des skills prêts à l'emploi (migrations, RLS, requêtes…) que Claude
saura invoquer automatiquement.

---

## 4. Lancer l'UI

```bash
npm run dev
# → http://localhost:3000
```

Tu verras la liste des 29 prospects, avec stats (acceptés / à vérifier / RDV).

---

## 5. Ce que Claude peut faire via le MCP

Une fois authentifié, dis simplement à Claude :

- *« Liste les prospects ACL et propose une stratégie pour éviter le pattern de 3 partners. »*
- *« Marque le prospect n°9 (Marc Chezot) comme RDV programmé le 12/05/2026. »*
- *« Ajoute un nouveau prospect : Pierre Durand, Partner chez Mazars, 2e niveau. »*
- *« Quels prospects de niveau 1er n'ont pas encore reçu de follow-up ? »*

Claude utilisera `execute_sql` (lecture) et `apply_migration` / `execute_sql`
(écriture) en s'appuyant sur le compte authentifié à l'étape 3.

---

## Schéma résumé

Table `public.prospects` :

| Colonne                | Type        | Notes                                    |
|------------------------|-------------|------------------------------------------|
| id                     | uuid (pk)   | `gen_random_uuid()`                      |
| numero                 | int unique  | N° d'ordre source (1..29…)               |
| date_envoi             | date        |                                          |
| prenom / nom           | text        |                                          |
| poste / societe        | text        |                                          |
| zone_geographique      | text        |                                          |
| niveau_relation        | text        | `1er` \| `2e` \| `3e`                    |
| angle_message          | text        | Angle utilisé                            |
| message_envoye         | text        | Extrait                                  |
| connexion_acceptee     | text        | `OUI` \| `NON` \| `À compléter`          |
| date_acceptation       | date        |                                          |
| date_followup_prevue   | date        |                                          |
| followup_envoye        | bool        | default false                            |
| reponse / type_reponse | text        |                                          |
| rdv_programme          | bool        | default false                            |
| notes                  | text        |                                          |
| source                 | text        | default `linkedin`                       |
| created_at / updated_at| timestamptz | trigger auto sur update                  |

RLS activée. Lecture autorisée pour `anon` / `authenticated`. Écriture
réservée au `service_role` (donc au MCP authentifié et aux scripts).
