import Sidebar from "@/components/Sidebar";
import { isAuthConfigured } from "@/lib/auth0";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar authConfigured={isAuthConfigured} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
