import { growth, topContent, kpis } from "@/lib/sample";
import DashboardView from "./DashboardView";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return <DashboardView growth={growth} topContent={topContent} kpis={kpis()} />;
}
