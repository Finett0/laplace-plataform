import { inArray } from "drizzle-orm";
import { getAuth0, isAuthConfigured } from "@/lib/auth0";
import { listAllOrganizations, listUserOrganizations, type Org } from "@/lib/organizations";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import OrgPicker from "./OrgPicker";

export const dynamic = "force-dynamic";

function isAdmin(session: {
  user?: { email?: string; [k: string]: unknown };
} | null): boolean {
  const admins = (process.env.LAPLACE_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const email = session?.user?.email?.toLowerCase();
  const roles = (session?.user?.["https://uselaplace.co/roles"] as string[]) ?? [];
  return Boolean((email && admins.includes(email)) || roles.includes("admin"));
}

export default async function SelectOrgPage() {
  let admin = true;
  let orgs: Org[];

  if (isAuthConfigured) {
    const session = await getAuth0().getSession();
    admin = isAdmin(session);
    orgs = admin
      ? await listAllOrganizations()
      : await listUserOrganizations((session!.user as { sub: string }).sub);
  } else {
    // preview sem Auth0
    orgs = await listAllOrganizations();
  }

  // enriquece cada org com a logo enviada (guardada no nosso Postgres, não no Auth0)
  try {
    const ids = orgs.map((o) => o.id);
    if (ids.length) {
      const rows = await db
        .select({ id: tenants.id, logoUrl: tenants.logoUrl })
        .from(tenants)
        .where(inArray(tenants.id, ids));
      const byId = new Map(rows.map((r) => [r.id, r.logoUrl]));
      orgs = orgs.map((o) => ({ ...o, logoUrl: byId.get(o.id) ?? o.logoUrl }));
    }
  } catch {
    /* sem banco: mantém o logoUrl do Auth0, se houver */
  }

  return <OrgPicker orgs={orgs} admin={admin} authConfigured={isAuthConfigured} />;
}
