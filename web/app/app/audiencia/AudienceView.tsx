"use client";

import { useMemo, useState } from "react";
import { audienceTotals, nf, type Person } from "@/lib/sample";
import { PageHeader } from "@/components/ui";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

export default function AudienceView({
  people,
  segments,
}: {
  people: Person[];
  segments: { label: string; share: number }[];
}) {
  const [q, setQ] = useState("");
  const [seg, setSeg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return people.filter(
      (p) =>
        (!seg || p.segment === seg) &&
        (!t || (p.name + p.headline + p.company + p.segment).toLowerCase().includes(t)),
    );
  }, [people, q, seg]);

  const maxShare = Math.max(...segments.map((s) => s.share));

  return (
    <div className="px-10 py-12">
      <PageHeader title="Audiência" subtitle="Quem engaja — o micro, não só o quanto." />

      {/* distribuição por cargo */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-[17px] font-bold tracking-[-.01em] text-ink">
            Distribuição por cargo
          </h3>
          <span className="text-[12.5px] text-faint">clique p/ filtrar a tabela</span>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr] lg:items-center">
          {/* hero */}
          <div className="lg:border-r lg:border-border lg:pr-6">
            <div className="font-display text-[44px] font-bold leading-none tabular-nums text-metal">
              {nf.format(audienceTotals.people)}
            </div>
            <div className="mt-1 text-[13px] text-muted">pessoas mapeadas</div>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-steel-50 px-3 py-1 text-[12.5px] font-medium text-steel-700">
              {nf.format(audienceTotals.reactions)} reações
            </div>
          </div>

          {/* barras rankeadas */}
          <ul className="space-y-3">
            {segments.map((s, i) => {
              const on = seg === s.label;
              const count = Math.round(s.share * audienceTotals.people);
              return (
                <li key={s.label}>
                  <button
                    onClick={() => setSeg(on ? null : s.label)}
                    className="group grid w-full grid-cols-[20px_1fr_auto] items-center gap-3 text-left"
                  >
                    <span
                      className={[
                        "font-mono text-[12px] tabular-nums transition-colors",
                        on ? "text-steel-600" : "text-faint",
                      ].join(" ")}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span className="mb-1.5 flex items-center justify-between">
                        <span
                          className={[
                            "truncate text-[13.5px] transition-colors",
                            on ? "font-semibold text-steel-700" : "font-medium text-ink",
                          ].join(" ")}
                        >
                          {s.label}
                        </span>
                      </span>
                      <span className="block h-2.5 overflow-hidden rounded-full bg-steel-50">
                        <span
                          className={[
                            "block h-full rounded-full transition-all duration-300",
                            on ? "bg-metal" : "bg-gradient-to-r from-steel-600 to-steel-400 group-hover:from-steel-700",
                          ].join(" ")}
                          style={{ width: `${(s.share / maxShare) * 100}%` }}
                        />
                      </span>
                    </span>
                    <span className="whitespace-nowrap pl-1 text-right text-[12.5px] tabular-nums text-muted">
                      <span className="font-semibold text-ink">{nf.format(count)}</span>
                      <span className="text-faint"> · {(s.share * 100).toFixed(0)}%</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* tabela */}
      <div className="mt-6 rounded-xl border border-border bg-surface shadow-sm">
        <div className="flex items-center gap-3 border-b border-border p-3.5">
          <label className="flex flex-1 items-center gap-2.5 rounded-lg border border-border-2 bg-surface-2 px-3 py-2 focus-within:border-steel-300">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#93A1B3" strokeWidth="2">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4-4" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome, cargo ou empresa"
              className="w-full bg-transparent text-[14px] text-ink placeholder:text-faint focus:outline-none"
            />
          </label>
          {seg && (
            <button
              onClick={() => setSeg(null)}
              className="flex items-center gap-1.5 rounded-full bg-steel-50 px-3 py-1.5 text-[12.5px] font-medium text-steel-700"
            >
              {seg} ✕
            </button>
          )}
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-faint">
              <th className="px-5 py-2.5 font-semibold">Pessoa</th>
              <th className="px-3 py-2.5 font-semibold">Empresa</th>
              <th className="px-3 py-2.5 font-semibold">Segmento</th>
              <th className="px-5 py-2.5 text-right font-semibold">Reações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={i} className="border-b border-border last:border-0 transition-colors hover:bg-steel-50/50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 flex-none place-items-center rounded-full border border-border-2 bg-surface-2 text-[12px] font-bold text-muted">
                      {initials(p.name)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-semibold text-ink">{p.name}</div>
                      <div className="truncate text-[12px] text-faint">{p.headline}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-[13.5px] text-muted">{p.company}</td>
                <td className="px-3 py-3">
                  <span className="rounded-md bg-steel-50 px-2 py-1 text-[12px] font-medium text-steel-700">
                    {p.segment}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-[14px] font-semibold tabular-nums text-ink">
                  {p.reactions}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-[13px] text-faint">
                  Ninguém encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-[12.5px] text-faint">
        Dados de exemplo — serão substituídos pela ingestão real (TikHub).
      </p>
    </div>
  );
}
