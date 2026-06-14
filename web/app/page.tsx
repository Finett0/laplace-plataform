import { redirect } from "next/navigation";
import { getAuth0, isAuthConfigured } from "@/lib/auth0";

export const dynamic = "force-dynamic";

/**
 * Porta de entrada:
 *  - sem Auth0 (preview) → vai direto pra tela de org
 *  - sem sessão → login (Universal Login da Auth0)
 *  - com org já escolhida → app
 *  - logado mas sem org → escolher org
 */
export default async function Home() {
  if (!isAuthConfigured) redirect("/app"); // preview: abre o app direto

  const session = await getAuth0().getSession();
  if (!session) redirect("/auth/login");

  const orgId = (session.user as { org_id?: string }).org_id;
  redirect(orgId ? "/app" : "/select-org");
}
