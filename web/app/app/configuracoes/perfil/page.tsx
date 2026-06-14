import { getAuth0, isAuthConfigured } from "@/lib/auth0";
import { Card } from "@/components/ui";

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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-border px-5 py-3.5 last:border-0">
      <span className="text-[13px] font-medium text-faint">{label}</span>
      <span className="min-w-0 truncate text-[14px] text-ink">{value}</span>
    </div>
  );
}

export default async function PerfilTab() {
  const session = isAuthConfigured ? await getAuth0().getSession() : null;
  const user = session?.user as { email?: string; name?: string } | undefined;
  const admin = isAdminEmail(user?.email);
  const canSwitch = canSwitchOrg(user?.email);

  return (
    <>
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
    </>
  );
}
