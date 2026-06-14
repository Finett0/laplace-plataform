"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { getSessionTenant } from "@/lib/tenant";

export type LogoResult = { ok: boolean; error?: string };

const MAX_BYTES = 256 * 1024; // logo pequena: cabe como data URL no Postgres
const TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export async function uploadLogo(
  _prev: LogoResult,
  formData: FormData,
): Promise<LogoResult> {
  const tenant = await getSessionTenant();
  if (!tenant) return { ok: false, error: "Sem organização selecionada." };

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "Selecione um arquivo." };
  if (!TYPES.includes(file.type))
    return { ok: false, error: "Use PNG, JPG, WEBP ou SVG." };
  if (file.size > MAX_BYTES)
    return { ok: false, error: "Imagem grande demais (máx. 256 KB)." };

  const buf = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${buf.toString("base64")}`;

  await db
    .insert(tenants)
    .values({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      logoUrl: dataUrl,
    })
    .onConflictDoUpdate({ target: tenants.id, set: { logoUrl: dataUrl } });

  revalidatePath("/app/configuracoes");
  revalidatePath("/app", "layout"); // atualiza a marca da sidebar
  return { ok: true };
}

export async function removeLogo(): Promise<void> {
  const tenant = await getSessionTenant();
  if (!tenant) return;
  await db
    .update(tenants)
    .set({ logoUrl: null })
    .where(eq(tenants.id, tenant.id));
  revalidatePath("/app/configuracoes");
  revalidatePath("/app", "layout");
}
