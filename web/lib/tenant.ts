import { getAuth0, isAuthConfigured } from "./auth0";

export type SessionTenant = { id: string; name: string; slug: string };

/**
 * Tenant do request, derivado da sessão Auth0 (org_id = tenant_id).
 * Retorna null se não há org selecionada (ou se Auth0 não está configurado).
 * É a ÚNICA fonte de tenant — server actions nunca confiam em id vindo do client.
 */
export async function getSessionTenant(): Promise<SessionTenant | null> {
  if (!isAuthConfigured) return null;
  const session = await getAuth0().getSession();
  const u = session?.user as
    | { org_id?: string; org_name?: string }
    | undefined;
  if (!u?.org_id) return null;
  const slug = u.org_name ?? u.org_id;
  return { id: u.org_id, name: u.org_name ?? u.org_id, slug };
}
