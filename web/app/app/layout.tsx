import { eq } from "drizzle-orm";
import Sidebar from "@/components/Sidebar";
import { isAuthConfigured } from "@/lib/auth0";
import { getSessionTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

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

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // marca da sidebar = identidade da organização (tenant) atual
  let orgName = "laplace";
  let orgInitials = "L";
  let orgLogo: string | null = null;
  const t = await getSessionTenant();
  if (t) {
    orgName = t.name; // fallback: slug da org no token
    try {
      const row = await db
        .select({ name: tenants.name, logoUrl: tenants.logoUrl })
        .from(tenants)
        .where(eq(tenants.id, t.id))
        .limit(1);
      if (row[0]?.name) orgName = row[0].name; // display name do banco ("Sunday Drops")
      orgLogo = row[0]?.logoUrl ?? null;
    } catch {
      /* sem banco: mantém o nome do token */
    }
    orgInitials = initials(orgName);
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar
        authConfigured={isAuthConfigured}
        orgName={orgName}
        orgInitials={orgInitials}
        orgLogo={orgLogo}
      />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
