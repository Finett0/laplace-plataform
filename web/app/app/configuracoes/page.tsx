import { eq } from "drizzle-orm";
import { getAuth0, isAuthConfigured } from "@/lib/auth0";
import { getSessionTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { PageHeader, Card } from "@/components/ui";
import LogoUploader from "./LogoUploader";

export const dynamic = "force-dynamic";

function isAdminEmail(email?: string) {
  const admins = (process.env.LAPLACE_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return Boolean(email && admins.includes(email.toLowerCase()));
}

/** Só equipe interna (e-mail @uselaplace.co) pode trocar de organização. */
function canSwitchOrg(email?: string) {
  return Boolean(email && email.toLowerCase().endsWith("@uselaplace.co"));
}

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

export default async function ConfiguracoesPage() {
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

  const session = isAuthConfigured ? await getAuth0().getSession() : null;
  const user = session?.user as
    | { email?: string; name?: string }
    | undefined;
  const admin = isAdminEmail(user?.email);
  const canSwitch = canSwitchOrg(user?.email);

  return (
    <div className="mx-auto max-w-[760px] px-10 py-12">
      <PageHeader
        title="Configurações"
        subtitle="Organização e conta. Mais ajustes chegam conforme a plataforma cresce."
      />

      <h2 className="mb-3 font-display text-[12px] font-semibold uppercase tracking-[.18em] text-faint">
        Organização
      </h2>
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

      <h2 className="mb-3 mt-8 font-display text-[12px] font-semibold uppercase tracking-[.18em] text-faint">
        Sua conta
      </h2>
      <Card>
        <Row label="Nome" value={user?.name ?? "—"} />
        <Row label="E-mail" value={user?.email ?? "—"} />
        <Row
          label="Acesso"
          value={
            admin ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-steel-200 bg-steel-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-steel-700">
                <span className="h-1.5 w-1.5 rounded-full bg-steel-500" />
                Admin
              </span>
            ) : (
              "Membro"
            )
          }
        />
      </Card>

      <div className="mt-8 flex items-center gap-4 text-[13px]">
        {canSwitch && (
          <>
            <a
              href="/select-org"
              className="font-semibold text-steel-600 transition-colors hover:text-steel-700"
            >
              Trocar organização
            </a>
            <span className="h-3 w-px bg-border-2" />
          </>
        )}
        <a
          href={isAuthConfigured ? "/auth/logout" : "/select-org"}
          className="font-semibold text-muted transition-colors hover:text-[#d1495b]"
        >
          Sair
        </a>
      </div>
    </div>
  );
}
