# mcp-prospects

**Connect Claude directly to a Supabase Postgres database to read and update a
catalog of LinkedIn prospects — through the Model Context Protocol (MCP).**

This repository is a minimal, public reference setup that demonstrates how to:

1. Host a `prospects` table on **Supabase Postgres** (schema + seed included).
2. Expose that database to **Claude** via the **Supabase MCP server** so the
   model can run SQL, apply migrations, and update rows on your behalf — using
   natural-language instructions.
3. Visualize the table from a small **Next.js 15 / React 19** UI.

Once the MCP is wired up, you can simply tell Claude things like *"mark
prospect #9 as a confirmed meeting on 2026-05-12"* or *"add a new prospect
named Pierre Durand, Partner at Mazars"*, and Claude will write to the database
itself — no manual SQL needed.

---

## 1. Install

```bash
git clone <this-repo> mcp-prospects
cd mcp-prospects
npm install
cp .env.example .env.local
# → fill in YOUR-PROJECT-REF / YOUR-PASSWORD / ANON_KEY / SERVICE_ROLE_KEY
```

Grab the keys from Supabase → your project → **Project Settings → API**, and
the project ref from the project URL (`https://<PROJECT-REF>.supabase.co`).

---

## 2. Create the schema and seed sample data

### Option A — via `psql`

```bash
$env:DATABASE_URL = "postgresql://postgres:YOUR_PASSWORD@db.YOUR-PROJECT-REF.supabase.co:5432/postgres"
psql $env:DATABASE_URL -f supabase/migrations/0001_init.sql
psql $env:DATABASE_URL -f supabase/seed.sql
```

### Option B — via the Supabase SQL Editor

Open Supabase → **SQL Editor** → paste, in order:

1. `supabase/migrations/0001_init.sql`
2. `supabase/seed.sql`

### Option C — via Claude itself (MCP)

Once the MCP is configured (step 3), just ask Claude:

> *"Apply the migration `supabase/migrations/0001_init.sql` and then the seed
> `supabase/seed.sql` to my database."*

Claude will use the Supabase MCP's `apply_migration` / `execute_sql` tools.

---

## 3. Configure the Supabase MCP for Claude

The [.mcp.json](.mcp.json) file at the repo root registers the Supabase MCP as
a **project-scoped** HTTP server. Replace `YOUR-PROJECT-REF` with your own
Supabase project ref:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=YOUR-PROJECT-REF"
    }
  }
}
```

CLI equivalent:

```bash
claude mcp add --scope project --transport http supabase \
  "https://mcp.supabase.com/mcp?project_ref=YOUR-PROJECT-REF"
```

### One-time authentication

In a **real terminal** (not the VS Code extension):

```bash
cd mcp-prospects
claude /mcp
```

→ select `supabase` → **Authenticate** → you will be redirected to Supabase to
grant access to your project.

### (Optional) Supabase agent skills

```bash
npx skills add supabase/agent-skills
```

Installs ready-made skills (migrations, RLS, queries…) that Claude can invoke
automatically.

---

## 4. Run the UI

```bash
npm run dev
# → http://localhost:3000
```

You will see the list of seeded prospects with quick stats (accepted / to
review / meetings booked).

---

## 5. What Claude can do via the MCP

Once authenticated, you can ask Claude in plain language:

- *"List all prospects from firm ACL and suggest a strategy."*
- *"Mark prospect #9 (Marc Chezot) as a confirmed meeting on 2026-05-12."*
- *"Add a new prospect: Pierre Durand, Partner at Mazars, 2nd-degree connection."*
- *"Which 1st-degree prospects haven't received a follow-up yet?"*

Claude uses `execute_sql` (read) and `apply_migration` / `execute_sql` (write)
under the account you authenticated in step 3.

---

## Schema summary

Table `public.prospects`:

| Column                 | Type        | Notes                                     |
|------------------------|-------------|-------------------------------------------|
| id                     | uuid (pk)   | `gen_random_uuid()`                       |
| numero                 | int unique  | source order number                       |
| date_envoi             | date        | outreach date                             |
| prenom / nom           | text        | first / last name                         |
| poste / societe        | text        | role / company                            |
| zone_geographique      | text        | geography                                 |
| niveau_relation        | text        | `1er` \| `2e` \| `3e`                     |
| angle_message          | text        | outreach angle                            |
| message_envoye         | text        | message excerpt                           |
| connexion_acceptee     | text        | `OUI` \| `NON` \| `À compléter`           |
| date_acceptation       | date        |                                           |
| date_followup_prevue   | date        |                                           |
| followup_envoye        | bool        | default `false`                           |
| reponse / type_reponse | text        |                                           |
| rdv_programme          | bool        | default `false`                           |
| notes                  | text        |                                           |
| source                 | text        | default `linkedin`                        |
| created_at / updated_at| timestamptz | auto-updated via trigger                  |

RLS is enabled. Read is allowed for `anon` / `authenticated`. Writes are
restricted to `service_role` (i.e. the authenticated MCP and server scripts).

---

## Security note

This repository is public. **Never commit `.env.local`**, your service role
key, or your database password. The `.env.example` and `.mcp.json` files ship
with placeholders only — fill them in locally.
