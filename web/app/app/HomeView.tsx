"use client";

import { useState } from "react";
import type { Insight } from "@/lib/sample";

const CHIPS = [
  "Recapitular a última semana",
  "Onde estão meus gaps de conteúdo?",
  "Qual tema rende mais por canal?",
];

const INSIGHT_META: Record<Insight["type"], { tag: string; icon: string }> = {
  up: { tag: "Tração", icon: "M4 17 9 11l4 4 7-8M14 7h6v6" },
  gap: { tag: "Gap", icon: "M12 9v4M12 17h0M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" },
  cross: { tag: "Cross-canal", icon: "M7 17 17 7M9 7h8v8" },
};

export default function HomeView({
  firstName,
  briefing,
  insights,
}: {
  firstName: string;
  briefing: { headline: string; bullets: string[] };
  insights: Insight[];
}) {
  const [q, setQ] = useState("");

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="mx-auto max-w-[860px] px-10 py-12">
      <header className="animate-rise">
        <h1 className="font-display text-[34px] font-bold tracking-[-.025em] text-ink">
          {greet}, {firstName}.
        </h1>
        <p className="mt-1 text-[15px] text-muted">
          Aqui está o estado do seu império de conteúdo.
        </p>
      </header>

      {/* briefing */}
      <section
        className="mt-9 animate-rise overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
        style={{ animationDelay: ".05s" }}
      >
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-3.5">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-metal text-[12px] font-bold text-white shadow-metal">
            +
          </span>
          <span className="text-[12.5px] font-semibold uppercase tracking-wide text-faint">
            Briefing da semana
          </span>
          <button className="ml-auto text-[12.5px] font-semibold text-steel-600 transition-colors hover:text-steel-700">
            ↻ Regenerar
          </button>
        </div>
        <div className="px-5 py-5">
          <p className="font-display text-[19px] font-semibold leading-snug tracking-[-.01em] text-ink">
            {briefing.headline}
          </p>
          <ul className="mt-4 space-y-2.5">
            {briefing.bullets.map((b, i) => (
              <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-muted">
                <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-steel-400" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* prompt */}
      <section className="mt-6 animate-rise" style={{ animationDelay: ".1s" }}>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-md focus-within:border-steel-300">
          <textarea
            value={q}
            onChange={(e) => setQ(e.target.value)}
            rows={2}
            placeholder="Pergunte aos seus dados…"
            className="w-full resize-none bg-transparent text-[15px] text-ink placeholder:text-faint focus:outline-none"
          />
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[12.5px] text-faint">Auto ⌄</span>
            <button
              disabled={!q.trim()}
              className="metal metal-sheen grid h-9 w-9 place-items-center rounded-[10px] text-white disabled:opacity-40"
              title="Enviar"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {CHIPS.map((c) => (
            <button
              key={c}
              onClick={() => setQ(c)}
              className="rounded-full border border-border-2 bg-surface px-3.5 py-1.5 text-[13px] font-medium text-muted transition-colors hover:border-steel-300 hover:text-steel-700"
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* insights */}
      <section className="mt-10 animate-rise" style={{ animationDelay: ".15s" }}>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-[13px] font-semibold uppercase tracking-[.18em] text-faint">
            Insights cross-canal
          </h2>
          <span className="text-[12px] text-faint">não óbvios</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {insights.map((it, i) => {
            const m = INSIGHT_META[it.type];
            return (
              <div key={i} className="rounded-xl border border-border bg-surface p-5 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-steel-50 text-steel-600">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={m.icon} />
                    </svg>
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-faint">
                    {m.tag}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-[15.5px] font-semibold tracking-[-.01em] text-ink">
                  {it.title}
                </h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{it.body}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
