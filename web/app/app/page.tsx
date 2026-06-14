import { getAuth0, isAuthConfigured } from "@/lib/auth0";
import { briefing, insights } from "@/lib/sample";
import HomeView from "./HomeView";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let firstName = "Giovanni";
  if (isAuthConfigured) {
    const session = await getAuth0().getSession();
    const name = (session?.user as { name?: string } | undefined)?.name;
    if (name) firstName = name.split(" ")[0];
  }
  return <HomeView firstName={firstName} briefing={briefing} insights={insights} />;
}
