// Applique une migration / un seed SQL via la connexion Postgres directe.
// Usage: node scripts/apply-sql.mjs supabase/migrations/0001_init.sql
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/apply-sql.mjs <chemin-vers-fichier.sql>");
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL manquant (charge .env.local d'abord)");
  process.exit(1);
}

const sql = readFileSync(resolve(file), "utf8");
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

try {
  console.log(`→ Connexion à ${url.replace(/:[^:@/]+@/, ":***@")}`);
  await client.connect();
  console.log(`→ Exécution de ${file} (${sql.length} caractères)`);
  await client.query(sql);
  console.log("✓ OK");
} catch (e) {
  console.error("✗ Erreur :", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
