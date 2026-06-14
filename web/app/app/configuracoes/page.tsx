import { eq } from "drizzle-orm";
import { getSessionTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { Card } from "@/components/ui";
import LogoUploader from "./LogoUploader";

export const dynamic = "force-dynamic";

function initials(name: string) {
  return (
    name
      .replace(/[^\p{L}\p{N} ]/gu, "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "·"
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-border px-5 py-3.5 last:border-0">
      <span className="text-[13px] font-medium text-faint">{label}</span>
      <span className="min-w-0 truncate text-[14px] text-ink">{value}</span>
    </div>
  );
}

export default async function WorkspaceTab() {
  const tenant = await getSessionTenant();

  let displayName = tenant?.name ?? "—";
  let logoUrl: string | null = null;
  if (tenant) {
    try {
      const row = await db
        .select({ name: tenants.name, logoUrl: tenants.logoUrl })
        .from(tenants)
        .where(eq(tenants.id, tenant.id))
        .limit(1);
      if (row[0]?.name) displayName = row[0].name;
      logoUrl = row[0]?.logoUrl ?? null;
    } catch {
      /* sem banco: mantém o nome do token */
    }
  }

  return (
    <Card>
      <div className="border-b border-border px-5 py-5">
        <div className="mb-1 text-[14px] font-semibold text-ink">
          Identidade visual
        </div>
        <div className="mb-4 text-[13px] text-muted">
          Adicione o logo do seu workspace — aparece na barra lateral.
        </div>
        <LogoUploader logoUrl={logoUrl} initials={initials(displayName)} />
      </div>
      <Row label="Nome" value={displayName} />
    </Card>
  );
}
