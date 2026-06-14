"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Tab = { href: string; label: string; icon: ReactNode };

const I = {
  workspace: (
    <>
      <rect x="4" y="3" width="11" height="18" rx="1.5" />
      <path d="M15 8h5v13H4" />
      <path d="M7.5 7h3M7.5 11h3M7.5 15h3" />
    </>
  ),
  link: (
    <>
      <path d="M9 15 15 9" />
      <path d="M11 6.5 13 4.5a4 4 0 0 1 6 6l-2 2M13 17.5l-2 2a4 4 0 0 1-6-6l2-2" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
};

const TABS: Tab[] = [
  { href: "/app/configuracoes", label: "Workspace", icon: I.workspace },
  { href: "/app/configuracoes/canais", label: "Canais", icon: I.link },
  { href: "/app/configuracoes/perfil", label: "Perfil", icon: I.person },
];

function isActive(pathname: string, href: string) {
  return href === "/app/configuracoes"
    ? pathname === "/app/configuracoes"
    : pathname.startsWith(href);
}

export default function SettingsTabs() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 inline-flex gap-1 rounded-xl border border-border bg-surface-2 p-1">
      {TABS.map((t) => {
        const on = isActive(pathname, t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={[
              "flex items-center gap-2 rounded-lg px-4 py-2 text-[13.5px] font-semibold transition-colors",
              on
                ? "bg-surface text-steel-700 shadow-sm"
                : "text-muted hover:text-steel-700",
            ].join(" ")}
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
              className="flex-none"
            >
              {t.icon}
            </svg>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
