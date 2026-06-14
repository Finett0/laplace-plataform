import { readFileSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// drizzle-kit não carrega .env.local — lemos manualmente (apenas DATABASE_URL).
function envLocal(key: string): string | undefined {
  if (process.env[key]) return process.env[key];
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && m[1] === key) return m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
  return undefined;
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: envLocal("DATABASE_URL")!,
  },
});
