"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Org } from "@/lib/organizations";

function initials(name: string) {
  return name
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default function OrgPicker({
  orgs,
  admin,
  authConfigured,
}: {
  orgs: Org[];
  admin: boolean;
  authConfigured: boolean;
}) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return orgs;
    return orgs.filter((o) => (o.name + " " + o.slug).toLowerCase().includes(t));
  }, [orgs, q]);

  useEffect(() => setActive(0), [q]);

  function choose(id: string) {
    if (busy) return;
    setBusy(id);
    window.location.href = `/auth/login?organization=${encodeURIComponent(id)}&returnTo=/app`;
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[active]) {
      e.preventDefault();
      choose(filtered[active].id);
    }
  }

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-i="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <main
      onKeyDown={onKeyDown}
      tabIndex={-1}
      className="grid min-h-screen grid-cols-1 bg-canvas text-ink outline-none lg:grid-cols-[minmax(340px,38%)_1fr]"
    >
      {/* ───────── coluna de identidade ───────── */}
      <aside className="relative flex flex-col justify-between gap-12 border-b border-border px-9 py-10 lg:border-b-0 lg:border-r lg:px-12 lg:py-14">
        {/* costura metálica na borda direita (desktop) */}
        <span className="absolute inset-y-0 right-0 hidden w-px bg-gradient-to-b from-transparent via-steel-400/50 to-transparent lg:block" />

        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-metal font-display text-[14px] font-bold text-white shadow-metal">
            L
          </span>
          <span className="font-display text-[18px] font-bold tracking-tight">laplace</span>
        </div>

        <div className="flex items-center gap-4 text-[12.5px] text-muted">
          {admin && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-steel-200 bg-steel-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-steel-700">
              <span className="h-1.5 w-1.5 rounded-full bg-steel-500" />
              Admin
            </span>
          )}
          <span className="tabular-nums">{orgs.length} organizações</span>
          {authConfigured && (
            <>
              <span className="h-3 w-px bg-border-2" />
              <a href="/auth/logout" className="transition-colors hover:text-steel-600">
                Sair
              </a>
            </>
          )}
        </div>
      </aside>

      {/* ───────── roster ───────── */}
      <section className="flex min-h-screen flex-col px-7 py-10 lg:px-14 lg:py-14">
        {/* header do roster */}
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-display text-[13px] font-semibold uppercase tracking-[.22em] text-faint">
            Organizações
          </h2>
          <span className="hidden items-center gap-2 text-[11.5px] text-faint sm:flex">
            <kbd className="rounded border border-border-2 px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd>
            navegar
            <kbd className="ml-1 rounded border border-border-2 px-1.5 py-0.5 font-mono text-[10px]">↵</kbd>
            entrar
          </span>
        </div>

        {/* busca — campo sublinhado, sem caixa */}
        <label className="mb-2 flex items-center gap-3 border-b border-border-2 pb-3 focus-within:border-steel-400">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#93A1B3" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4-4" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar organização"
            autoFocus
            className="w-full bg-transparent font-display text-[20px] tracking-tight text-ink placeholder:text-faint focus:outline-none"
          />
        </label>

        {/* lista */}
        <ul ref={listRef} className="-mx-3 mt-2 flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <li className="px-3 py-16 text-[14px] text-faint">
              {orgs.length === 0
                ? "Nenhuma organização disponível."
                : `Nada encontrado para “${q}”.`}
            </li>
          )}
          {filtered.map((o, i) => {
            const on = i === active;
            return (
              <li key={o.id} data-i={i}>
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(o.id)}
                  disabled={busy !== null}
                  className={[
                    "group relative grid w-full grid-cols-[auto_1fr_auto] items-center gap-5 rounded-xl px-3 py-4 text-left transition-colors duration-150",
                    on ? "bg-steel-50" : "hover:bg-steel-50/60",
                  ].join(" ")}
                  style={{ animation: `rise .5s cubic-bezier(.22,.61,.36,1) ${i * 0.035}s both` }}
                >
                  {/* barra metálica que entra à esquerda quando ativo */}
                  <span
                    className={[
                      "absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full bg-metal transition-all duration-200",
                      on ? "opacity-100" : "opacity-0",
                    ].join(" ")}
                  />
                  {/* índice */}
                  <span
                    className={[
                      "w-7 font-mono text-[12px] tabular-nums transition-colors",
                      on ? "text-steel-600" : "text-faint",
                    ].join(" ")}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* logo + nome */}
                  <span className="flex min-w-0 items-center gap-4">
                    {o.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={o.logoUrl}
                        alt=""
                        className="h-10 w-10 flex-none rounded-[10px] border border-border object-cover"
                      />
                    ) : (
                      <span
                        className={[
                          "grid h-10 w-10 flex-none place-items-center rounded-[10px] font-display text-[13px] font-bold transition-all duration-200",
                          on
                            ? "bg-metal text-white shadow-metal"
                            : "border border-border-2 bg-surface text-muted",
                        ].join(" ")}
                      >
                        {initials(o.name) || "•"}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate font-display text-[19px] font-medium tracking-[-.01em] text-ink">
                        {o.name}
                      </span>
                      <span className="block truncate font-mono text-[12px] text-faint">
                        {o.slug}
                      </span>
                    </span>
                  </span>

                  {/* ação */}
                  <span className="flex items-center">
                    {busy === o.id ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-steel-200 border-t-steel-500" />
                    ) : (
                      <span
                        className={[
                          "flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide transition-all duration-200",
                          on ? "translate-x-0 text-steel-600 opacity-100" : "translate-x-1 opacity-0",
                        ].join(" ")}
                      >
                        Entrar
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
