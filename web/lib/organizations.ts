import { isAuthConfigured } from "./auth0";

export type Org = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
};

const mgmtConfigured = () =>
  Boolean(process.env.AUTH0_MGMT_CLIENT_ID && process.env.AUTH0_MGMT_CLIENT_SECRET);

async function mgmtToken(): Promise<string> {
  const res = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.AUTH0_MGMT_CLIENT_ID,
      client_secret: process.env.AUTH0_MGMT_CLIENT_SECRET,
      audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Auth0 token ${res.status}`);
  return (await res.json()).access_token as string;
}

function mapOrg(o: {
  id: string;
  name: string;
  display_name?: string;
  branding?: { logo_url?: string };
}): Org {
  return {
    id: o.id,
    name: o.display_name ?? o.name,
    slug: o.name,
    logoUrl: o.branding?.logo_url,
  };
}

/** Admin: todas as organizações do tenant (Management API). */
export async function listAllOrganizations(): Promise<Org[]> {
  if (!isAuthConfigured || !mgmtConfigured()) return [];
  const token = await mgmtToken();
  const res = await fetch(
    `https://${process.env.AUTH0_DOMAIN}/api/v2/organizations?per_page=100`,
    { headers: { authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  const data = await res.json();
  return (Array.isArray(data) ? data : data.organizations ?? []).map(mapOrg);
}

/** Usuário comum: só as orgs de que ele participa. */
export async function listUserOrganizations(userId: string): Promise<Org[]> {
  if (!isAuthConfigured || !mgmtConfigured()) return [];
  const token = await mgmtToken();
  const res = await fetch(
    `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(userId)}/organizations`,
    { headers: { authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map(mapOrg);
}
