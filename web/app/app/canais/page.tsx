import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { connectedChannels } from "@/lib/db/schema";
import { getSessionTenant } from "@/lib/tenant";
import { isAuthConfigured } from "@/lib/auth0";
import ChannelsView from "./ChannelsView";

export const dynamic = "force-dynamic";

export default async function CanaisPage() {
  const tenant = await getSessionTenant();

  if (!tenant) {
    return (
      <div className="px-10 py-12">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
          <h1 className="font-display text-[20px] font-bold text-ink">
            {isAuthConfigured ? "Selecione uma organização" : "Auth0 não configurado"}
          </h1>
          <p className="mt-2 text-[14px] text-muted">
            {isAuthConfigured
              ? "Os canais são por organização. Escolha uma para conectar canais."
              : "Configure o Auth0 (.env.local) para resolver o tenant da sessão."}
          </p>
          {isAuthConfigured && (
            <a
              href="/select-org"
              className="metal metal-sheen mt-5 inline-flex rounded-lg px-4 py-2 text-[14px] font-semibold text-white"
            >
              Escolher organização
            </a>
          )}
        </div>
      </div>
    );
  }

  const channels = await db
    .select()
    .from(connectedChannels)
    .where(eq(connectedChannels.tenantId, tenant.id))
    .orderBy(desc(connectedChannels.createdAt));

  return <ChannelsView tenantName={tenant.name} channels={channels} />;
}
