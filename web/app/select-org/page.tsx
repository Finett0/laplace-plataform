import { getAuth0, isAuthConfigured } from "@/lib/auth0";
import { listAllOrganizations, listUserOrganizations, type Org } from "@/lib/organizations";
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

  return <OrgPicker orgs={orgs} admin={admin} authConfigured={isAuthConfigured} />;
}
