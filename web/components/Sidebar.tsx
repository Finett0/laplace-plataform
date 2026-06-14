"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Item = { href: string; label: string; icon: ReactNode; badge?: string };
type Group = { label: string; items: Item[] };

const I = {
  home: (
    <>
      <path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v9h14v-9" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  graph: (
    <>
      <circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="9" r="2.5" /><circle cx="9" cy="18" r="2.5" />
      <path d="M8 7.5 16 9M8 16l8-5" />
    </>
  ),
  people: (
    <>
      <circle cx="12" cy="9" r="3.5" /><path d="M4 19a6 6 0 0 1 4-5M20 19a6 6 0 0 0-4-5" />
    </>
  ),
  trend: (
    <>
      <path d="M4 17 9 11l4 4 7-8" /><path d="M14 7h6v6" />
    </>
  ),
  cog: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
    </>
  ),
};

const GROUPS: Group[] = [
  {
    label: "Visão",
    items: [
      { href: "/app", label: "Home", icon: I.home, badge: "IA" },
      { href: "/app/dashboard", label: "Dashboard", icon: I.grid },
    ],
  },
  {
    label: "Inteligência",
    items: [
      { href: "/app/grafo", label: "Grafo", icon: I.graph },
      { href: "/app/audiencia", label: "Audiência", icon: I.people },
      { href: "/app/previsao", label: "Previsão", icon: I.trend, badge: "2" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

export default function Sidebar({
  authConfigured,
  orgName,
  orgInitials,
  orgLogo,
}: {
  authConfigured: boolean;
  orgName: string;
  orgInitials: string;
  orgLogo?: string | null;
}) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-[256px] flex-none flex-col gap-1 border-r border-border bg-surface px-3.5 py-4">
      {/* marca = organização (tenant) atual */}
      <div className="flex items-center gap-2.5 px-2 pb-3.5 pt-1">
        {orgLogo ? (
          <span className="h-8 w-8 flex-none overflow-hidden rounded-[9px] border border-border shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={orgLogo} alt="" className="h-full w-full object-cover" />
          </span>
        ) : (
          <span className="grid h-8 w-8 flex-none place-items-center rounded-[9px] bg-metal font-display text-[13px] font-bold text-white shadow-metal">
            {orgInitials}
          </span>
        )}
        <span className="min-w-0 truncate font-display text-[18px] font-bold tracking-tight text-ink">
          {orgName}
        </span>
      </div>

      {GROUPS.map((g) => (
        <div key={g.label} className="mt-2">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.09em] text-faint">
            {g.label}
          </div>
          {g.items.map((it) => {
            const on = isActive(pathname, it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={[
                  "relative mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] transition-colors",
                  on
                    ? "bg-steel-50 font-semibold text-steel-700"
                    : "font-medium text-muted hover:bg-steel-50 hover:text-steel-700",
                ].join(" ")}
              >
                {on && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-metal" />
                )}
                <svg
                  width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
                  className="flex-none"
                >
                  {it.icon}
                </svg>
                {it.label}
                {it.badge && (
                  <span className="ml-auto grid h-5 min-w-[20px] place-items-center rounded-full bg-metal px-1.5 text-[11px] font-bold text-white shadow-sm">
                    {it.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}

      <div className="flex-1" />

      <Link
        href="/app/configuracoes"
        className="mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium text-muted transition-colors hover:bg-steel-50 hover:text-steel-700"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
          {I.cog}
        </svg>
        Configurações
      </Link>

      <a
        href={authConfigured ? "/auth/logout" : "/select-org"}
        className="mt-1 flex items-center gap-3 border-t border-border px-2 pt-3"
      >
        <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-metal font-display text-[13px] font-bold text-white shadow-metal">
          GF
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] font-semibold text-ink">Giovanni Finetto</span>
          <span className="block truncate text-[12px] text-faint">
            Admin · {authConfigured ? "sair" : "trocar org"}
          </span>
        </span>
      </a>
    </aside>
  );
}
