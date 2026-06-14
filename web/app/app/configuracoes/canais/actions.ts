"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { connectedChannels, tenants } from "@/lib/db/schema";
import { getSessionTenant } from "@/lib/tenant";
import { PLATFORMS, type Platform, type ActionResult } from "./platforms";

/**
 * Extrai o handle/username de uma URL ou texto solto.
 * Mantém `@` quando o YouTube usa handle; senão devolve o último segmento limpo.
 */
function normalizeHandle(platform: Platform, raw: string): string {
  let h = raw.trim();
  // se colaram uma URL, pega o pedaço relevante
  const urlMatch = h.match(/^https?:\/\/[^/]+\/(.+)$/i);
  if (urlMatch) h = urlMatch[1];
  h = h.split(/[?#]/)[0].replace(/\/+$/, ""); // tira query/hash e barra final
  const last = h.split("/").filter(Boolean).pop() ?? h;
  h = last.trim();
  if (platform === "youtube") {
    // canais por handle vêm como @nome; mantém o @
    if (h && !h.startsWith("@") && !/^UC[\w-]{20,}$/.test(h)) h = "@" + h;
  } else {
    h = h.replace(/^@/, "");
  }
  return h;
}

export async function addChannel(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const tenant = await getSessionTenant();
  if (!tenant) return { ok: false, error: "Sem organização selecionada." };

  const platform = String(formData.get("platform") ?? "") as Platform;
  if (!PLATFORMS.includes(platform))
    return { ok: false, error: "Plataforma inválida." };

  const handle = normalizeHandle(platform, String(formData.get("handle") ?? ""));
  if (!handle) return { ok: false, error: "Informe o handle ou a URL do canal." };

  // garante a linha do tenant (não sobrescreve nome já populado pelo seed)
  await db
    .insert(tenants)
    .values({ id: tenant.id, name: tenant.name, slug: tenant.slug })
    .onConflictDoNothing();

  const inserted = await db
    .insert(connectedChannels)
    .values({ tenantId: tenant.id, platform, handle })
    .onConflictDoNothing()
    .returning({ id: connectedChannels.id });

  if (inserted.length === 0)
    return { ok: false, error: "Esse canal já está conectado." };

  revalidatePath("/app/configuracoes/canais");
  return { ok: true };
}

export async function removeChannel(formData: FormData): Promise<void> {
  const tenant = await getSessionTenant();
  if (!tenant) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db
    .delete(connectedChannels)
    .where(
      and(
        eq(connectedChannels.id, id),
        eq(connectedChannels.tenantId, tenant.id), // isolamento por tenant
      ),
    );
  revalidatePath("/app/configuracoes/canais");
}

export async function toggleChannel(formData: FormData): Promise<void> {
  const tenant = await getSessionTenant();
  if (!tenant) return;
  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("next") ?? "active") === "active"
    ? "active"
    : "paused";
  if (!id) return;
  await db
    .update(connectedChannels)
    .set({ status: next })
    .where(
      and(
        eq(connectedChannels.id, id),
        eq(connectedChannels.tenantId, tenant.id),
      ),
    );
  revalidatePath("/app/configuracoes/canais");
}
