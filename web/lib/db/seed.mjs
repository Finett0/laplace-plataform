/**
 * Seed: sincroniza a tabela `tenants` com as Organizations reais do Auth0.
 * Fecha o ciclo Auth0 → banco. Idempotente (upsert por id = org_id).
 * Usa pg cru (sem importar o schema .ts) — roda com:  npm run db:seed
 */
import { Pool } from "pg";

const {
  AUTH0_DOMAIN,
  AUTH0_MGMT_CLIENT_ID,
  AUTH0_MGMT_CLIENT_SECRET,
  DATABASE_URL,
} = process.env;

if (!AUTH0_DOMAIN || !AUTH0_MGMT_CLIENT_ID || !AUTH0_MGMT_CLIENT_SECRET) {
  console.error("Faltam vars Auth0 (DOMAIN/MGMT_CLIENT_ID/MGMT_CLIENT_SECRET).");
  process.exit(1);
}

async function mgmtToken() {
  const res = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: AUTH0_MGMT_CLIENT_ID,
      client_secret: AUTH0_MGMT_CLIENT_SECRET,
      audience: `https://${AUTH0_DOMAIN}/api/v2/`,
    }),
  });
  if (!res.ok) throw new Error(`Auth0 token ${res.status}`);
  return (await res.json()).access_token;
}

async function listOrgs(token) {
  const res = await fetch(`https://${AUTH0_DOMAIN}/api/v2/organizations?per_page=100`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Auth0 orgs ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : data.organizations ?? [];
}

const pool = new Pool({ connectionString: DATABASE_URL });

try {
  const orgs = await listOrgs(await mgmtToken());
  console.log(`Auth0 retornou ${orgs.length} organization(s).`);
  for (const o of orgs) {
    const name = o.display_name ?? o.name;
    await pool.query(
      `INSERT INTO tenants (id, name, slug) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug`,
      [o.id, name, o.name],
    );
    console.log(`  ✓ ${o.id}  ${name} (${o.name})`);
  }
  const { rows } = await pool.query("SELECT count(*)::int AS n FROM tenants");
  console.log(`tenants no banco: ${rows[0].n}`);
} catch (e) {
  console.error("Seed falhou:", e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
