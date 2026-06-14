/**
 * Client do banco (Postgres via node-postgres + Drizzle).
 * Dev: Postgres local (Docker). Prod (Vercel): Postgres gerenciado (Prisma/Neon)
 * — a integração da Vercel injeta a connection string; tentamos os nomes comuns.
 *
 * Singleton em globalThis pra não recriar o pool a cada hot-reload do Next.
 */
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export function resolveDatabaseUrl(): string | undefined {
  // Preferimos a conexão TCP direta. Aceitamos só `postgres://` padrão —
  // rejeita `prisma+postgres://` (Accelerate), que o driver `pg` não consegue usar.
  const candidates = [
    process.env.DATABASE_POSTGRES_URL, // integração Vercel: conexão direta
    process.env.POSTGRES_URL,
    process.env.DATABASE_URL, // dev local (Docker) cai aqui
    process.env.DATABASE_PRISMA_DATABASE_URL,
  ];
  return candidates.find((u) => u && /^postgres(ql)?:\/\//i.test(u));
}

/** Conexões remotas (não-localhost) exigem TLS. */
function sslFor(url: string | undefined) {
  if (!url) return undefined;
  const local = /@(localhost|127\.0\.0\.1|db:)/.test(url);
  return local ? undefined : { rejectUnauthorized: false };
}

const globalForDb = globalThis as unknown as { __laplacePool?: Pool };

const connectionString = resolveDatabaseUrl();
const pool =
  globalForDb.__laplacePool ??
  new Pool({ connectionString, ssl: sslFor(connectionString) });

if (process.env.NODE_ENV !== "production") globalForDb.__laplacePool = pool;

export const db = drizzle(pool, { schema });
export { schema };
