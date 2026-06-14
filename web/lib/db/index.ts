/**
 * Client do banco (Postgres via node-postgres + Drizzle).
 * Dev: Postgres local (Docker). Prod (Vercel): Neon — só muda a DATABASE_URL.
 *
 * Singleton em globalThis pra não recriar o pool a cada hot-reload do Next.
 */
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { __laplacePool?: Pool };

const pool =
  globalForDb.__laplacePool ??
  new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") globalForDb.__laplacePool = pool;

export const db = drizzle(pool, { schema });
export { schema };
