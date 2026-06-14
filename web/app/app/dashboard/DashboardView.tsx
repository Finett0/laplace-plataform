"use client";

import { useMemo, useState } from "react";
import {
  CHANNEL_LABEL,
  nf,
  type Channel,
  type Content,
  type GrowthPoint,
} from "@/lib/sample";
import { PageHeader, ChannelDot, Delta } from "@/components/ui";

const CHANNELS: Channel[] = ["youtube", "instagram", "linkedin"];
const BAR_COLOR: Record<Channel, string> = {
  youtube: "var(--steel-700)",
  instagram: "var(--steel-400)",
  linkedin: "var(--steel-500)",
};

export default function DashboardView({
  growth,
  topContent,
  kpis,
}: {
  growth: GrowthPoint[];
  topContent: Content[];
  kpis: ReturnType<typeof import("@/lib/sample").kpis>;
}) {
  const [on, setOn] = useState<Record<Channel, boolean>>({
    youtube: true,
    instagram: true,
    linkedin: true,
  });

  const active = CHANNELS.filter((c) => on[c]);

  const { bars, max, totals } = useMemo(() => {
    const totals = { eng: 0 };
    const bars = growth.map((g) => {
      const segs = active.map((c) => ({ c, v: g[c] }));
      const sum = segs.reduce((a, s) => a + s.v, 0);
      totals.eng += sum;
      return { month: g.month, segs, sum };
    });
    const max = Math.max(1, ...bars.map((b) => b.sum));
    return { bars, max, totals };
  }, [growth, active]);

  return (
    <div className="px-10 py-12">
      <PageHeader
        title="Relatório de conteúdo"
        subtitle="Engajamento por canal · dado público"
        actions={
          <>
            <button className="rounded-[10px] border border-border-2 bg-surface px-3.5 py-2 text-[13.5px] font-semibold text-muted shadow-sm transition-colors hover:border-steel-300">
              Tudo ⌄
            </button>
            <button className="rounded-[10px] border border-border-2 bg-surface px-3.5 py-2 text-[13.5px] font-semibold text-muted shadow-sm transition-colors hover:border-steel-300">
              Exportar
            </button>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { lbl: "Conteúdos", val: nf.format(kpis.conteudos), sub: "3 canais" },
          { lbl: "Engajamento", val: nf.format(totals.eng), sub: "curtidas + comentários" },
          { lbl: "Alcance previsto", val: nf.format(kpis.alcancePrevisto), delta: kpis.alcanceDelta },
          { lbl: "Super-fãs", val: nf.format(kpis.superFas), sub: `conectores: ${kpis.conectores}` },
        ].map((k) => (
          <div key={k.lbl} className="relative overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-sm">
            <span className="absolute inset-y-0 left-0 w-[3px] bg-metal" />
            <div className="text-[11.5px] font-semibold uppercase tracking-wide text-faint">{k.lbl}</div>
            <div className="mt-2 font-display text-[28px] font-bold tabular-nums tracking-[-.02em] text-metal">
              {k.val}
            </div>
            <div className="mt-0.5 text-[12px] text-muted">
              {k.delta !== undefined ? <Delta value={k.delta} /> : k.sub}
            </div>
          </div>
        ))}
      </div>

      {/* gráfico */}
      <div className="mt-6 rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="font-display text-[17px] font-bold tracking-[-.01em] text-ink">
              Engajamento por canal
            </h3>
            <p className="text-[13px] text-muted">Soma mensal · clique na legenda p/ filtrar</p>
          </div>
        </div>

        <div className="flex h-[200px] items-end gap-3">
          {bars.map((b) => (
            <div key={b.month} className="group flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full flex-1 flex-col-reverse">
                {b.segs.map((s) => (
                  <div
                    key={s.c}
                    title={`${CHANNEL_LABEL[s.c]}: ${nf.format(s.v)}`}
                    style={{
                      height: `${(s.v / max) * 100}%`,
                      background: BAR_COLOR[s.c],
                    }}
                    className="w-full first:rounded-t-[5px]"
                  />
                ))}
              </div>
              <span className="text-[11px] text-faint">{b.month}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {CHANNELS.map((c) => (
            <button
              key={c}
              onClick={() => setOn((s) => ({ ...s, [c]: !s[c] }))}
              className={[
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
                on[c]
                  ? "border-border-2 bg-surface text-ink"
                  : "border-border bg-surface-2 text-faint line-through",
              ].join(" ")}
            >
              <ChannelDot channel={c} />
              {CHANNEL_LABEL[c]}
            </button>
          ))}
        </div>
      </div>

      {/* top conteúdos */}
      <div className="mt-6 rounded-xl border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <h3 className="font-display text-[17px] font-bold tracking-[-.01em] text-ink">
            Top conteúdos
          </h3>
          <span className="text-[12.5px] text-faint">ordenado por engajamento</span>
        </div>
        <div className="overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-y border-border text-[11px] font-semibold uppercase tracking-wide text-faint">
                <th className="px-6 py-2.5 font-semibold">Peça</th>
                <th className="px-3 py-2.5 font-semibold">Canal</th>
                <th className="px-3 py-2.5 font-semibold">Tema</th>
                <th className="px-3 py-2.5 text-right font-semibold">Engaj.</th>
                <th className="px-6 py-2.5 text-right font-semibold">Tend.</th>
              </tr>
            </thead>
            <tbody>
              {topContent.map((c, i) => (
                <tr key={i} className="border-b border-border last:border-0 transition-colors hover:bg-steel-50/50">
                  <td className="max-w-[380px] px-6 py-3.5 text-[14px] font-medium text-ink">
                    <span className="line-clamp-1">{c.title}</span>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="flex items-center gap-2 text-[13px] text-muted">
                      <ChannelDot channel={c.channel} />
                      {CHANNEL_LABEL[c.channel]}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="rounded-md bg-steel-50 px-2 py-1 text-[12px] font-medium text-steel-700">
                      {c.theme}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-right text-[14px] font-semibold tabular-nums text-ink">
                    {nf.format(c.engagement)}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Delta value={c.trend} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-6 text-[12.5px] text-faint">
        Dados de exemplo — serão substituídos pela ingestão real (TikHub).
      </p>
    </div>
  );
}
