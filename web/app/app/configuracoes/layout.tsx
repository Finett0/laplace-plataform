import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui";
import SettingsTabs from "./SettingsTabs";

export default function ConfiguracoesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[880px] px-10 py-12">
      <PageHeader
        title="Configurações"
        subtitle="Gerencie a conta e o workspace. Mais ajustes chegam conforme a plataforma cresce."
      />
      <SettingsTabs />
      {children}
    </div>
  );
}
