"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
  CLUSTER_COLORS,
  CHANNEL_LABEL,
  themeNodes,
  themeLinks,
  buildAudienceGraph,
  nf,
  type ThemeNode,
  type PersonNode,
} from "@/lib/sample";
import { PageHeader } from "@/components/ui";
import type { GNode } from "./ForceCanvas";

const ForceCanvas = dynamic(() => import("./ForceCanvas"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-[13px] text-faint">Montando o grafo…</div>
  ),
});

type Tab = "temas" | "audiencia";

export default function GraphView() {
  const [tab, setTab] = useState<Tab>("temas");
  const [sel, setSel] = useState<string | null>(null);

  // grau por nó (temas)
  const themeDegree = useMemo(() => {
    const d = new Map<string, number>();
    themeNodes.forEach((n) => d.set(n.id, 0));
    themeLinks.forEach((l) => {
      d.set(l.source, (d.get(l.source) ?? 0) + 1);
      d.set(l.target, (d.get(l.target) ?? 0) + 1);
    });
    return d;
  }, []);

  const themeGraph = useMemo(
    () => ({
      nodes: themeNodes.map<GNode>((n) => ({
        id: n.id,
        label: n.label,
        cluster: n.cluster,
        val: themeDegree.get(n.id) ?? 1,
        isBridge: n.isBridge,
        isGap: n.isGap,
      })),
      links: themeLinks,
    }),
    [themeDegree],
  );

  const audience = useMemo(() => buildAudienceGraph(), []);
  const audienceGraph = useMemo(
    () => ({
      nodes: audience.nodes.map<GNode>((n) => ({
        id: n.id,
        label: n.label,
        cluster: n.cluster,
        val: n.reactions * 0.5,
      })),
      links: audience.links,
    }),
    [audience],
  );

  const selThemeRaw = themeNodes.find((n) => n.id === sel);
  const selPerson = audience.nodes.find((n) => n.id === sel);

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center justify-between border-b border-border px-10 py-5">
        <h1 className="font-display text-[26px] font-bold tracking-[-.02em] text-ink">
          Grafo de relações
        </h1>
        <div className="flex rounded-lg border border-border-2 bg-surface p-0.5 text-[13.5px] font-semibold">
          {(["temas", "audiencia"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setSel(null);
              }}
              className={[
                "rounded-md px-4 py-1.5 transition-colors",
                tab === t ? "metal text-white" : "text-muted hover:text-steel-700",
              ].join(" ")}
            >
              {t === "temas" ? "Temas" : "Audiência"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[1fr_320px]">
        {/* canvas */}
        <div className="relative min-h-0">
          {tab === "temas" ? (
            <ForceCanvas
              nodes={themeGraph.nodes}
              links={themeGraph.links}
              selectedId={sel}
              onSelect={setSel}
              labelMinVal={0}
              sizeScale={1.1}
            />
          ) : (
            <ForceCanvas
              nodes={audienceGraph.nodes}
              links={audienceGraph.links}
              selectedId={sel}
              onSelect={setSel}
              labelMinVal={6}
              sizeScale={0.7}
            />
          )}
          <Legend tab={tab} />
        </div>

        {/* painel lateral */}
        <aside className="min-h-0 overflow-y-auto border-l border-border bg-surface px-6 py-7">
          {tab === "temas" ? (
            selThemeRaw ? (
              <ThemePanel node={selThemeRaw} degree={themeDegree.get(selThemeRaw.id) ?? 0} />
            ) : (
              <EmptyPanel
                title="Selecione um tema"
                body="Clique num nó para ver centralidade, peças e os canais onde ele vive. Passe o mouse para isolar a vizinhança."
              />
            )
          ) : selPerson ? (
            <PersonPanel node={selPerson} />
          ) : (
            <AudienceOverview total={audience.nodes.length} />
          )}
        </aside>
      </div>
    </div>
  );
}

function ThemePanel({ node, degree }: { node: ThemeNode; degree: number }) {
  return (
    <div className="animate-rise">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ background: CLUSTER_COLORS[node.cluster % CLUSTER_COLORS.length] }}
      />
      <h2 className="mt-2 font-display text-[20px] font-bold tracking-[-.01em] text-ink">{node.label}</h2>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Stat label="Grau" value={String(degree)} />
        <Stat label="Peças" value={String(node.pieces)} />
      </div>

      {node.isBridge && (
        <Tag tone="bridge">Nó-ponte — conecta clusters distintos</Tag>
      )}
      {node.isGap && (
        <Tag tone="gap">Gap — alta atenção por peça, pouco volume. A audiência puxa, você não cobre.</Tag>
      )}

      <div className="mt-6 text-[11px] font-semibold uppercase tracking-wide text-faint">Canais</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {node.channels.map((c) => (
          <span key={c} className="rounded-md bg-steel-50 px-2 py-1 text-[12px] font-medium text-steel-700">
            {CHANNEL_LABEL[c]}
          </span>
        ))}
      </div>
    </div>
  );
}

function PersonPanel({ node }: { node: PersonNode }) {
  return (
    <div className="animate-rise">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-metal text-[14px] font-bold text-white shadow-metal">
          {node.label.slice(0, 2).toUpperCase()}
        </span>
        <h2 className="font-display text-[18px] font-bold text-ink">{node.label}</h2>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Stat label="Reações" value={String(node.reactions)} />
        <Stat label="Comunidade" value={"#" + (node.cluster + 1)} />
      </div>
      <p className="mt-5 text-[13px] leading-relaxed text-muted">
        Tamanho do nó = fidelidade (nº de reações). Arestas ligam quem curtiu os mesmos posts.
      </p>
    </div>
  );
}

function AudienceOverview({ total }: { total: number }) {
  return (
    <div className="animate-rise">
      <div className="flex items-baseline gap-4">
        <span className="font-display text-[30px] font-bold tabular-nums text-metal">{nf.format(1263)}</span>
        <span className="text-[12px] text-faint">{nf.format(1487)} reações</span>
      </div>
      <div className="mt-1 text-[12px] text-muted">{total} pessoas na rede em foco</div>
      <p className="mt-5 text-[13px] leading-relaxed text-muted">
        Clique numa pessoa para ver perfil e comunidade. Cada cor é um cluster de co-engajamento —
        quem reage junto aos mesmos conteúdos.
      </p>
    </div>
  );
}

function EmptyPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="grid h-full place-items-center text-center">
      <div>
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-steel-50 text-steel-500">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="m3 11 19-9-9 19-2-8-8-2z" />
          </svg>
        </div>
        <h3 className="mt-3 font-display text-[15px] font-semibold text-ink">{title}</h3>
        <p className="mx-auto mt-1.5 max-w-[28ch] text-[13px] leading-relaxed text-muted">{body}</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-faint">{label}</div>
      <div className="mt-0.5 font-display text-[20px] font-bold tabular-nums text-ink">{value}</div>
    </div>
  );
}

function Tag({ tone, children }: { tone: "bridge" | "gap"; children: React.ReactNode }) {
  const cls =
    tone === "bridge"
      ? "border-steel-200 bg-steel-50 text-steel-700"
      : "border-[#f0d9af] bg-[#fdf6e9] text-[#a9711e]";
  return <div className={`mt-4 rounded-lg border px-3 py-2.5 text-[12.5px] leading-snug ${cls}`}>{children}</div>;
}

function Legend({ tab }: { tab: Tab }) {
  const rows =
    tab === "temas"
      ? [
          ["tamanho = grau (centralidade)", "dot"],
          ["cor = comunidade de temas", "dot2"],
          ["espessura da aresta = co-ocorrência", "line"],
          ["halo = nó-ponte (conecta clusters)", "halo"],
          ["anel tracejado = gap de conteúdo", "gap"],
        ]
      : [
          ["cada nó = uma pessoa que reage", "dot"],
          ["cor = comunidade (engaja junto)", "dot2"],
          ["aresta = curtiram os mesmos posts", "line"],
          ["tamanho = nº de reações (fidelidade)", "dot"],
        ];
  return (
    <div className="absolute bottom-5 left-5 rounded-xl border border-border bg-surface/90 px-4 py-3 shadow-sm backdrop-blur">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">Como ler</div>
      <ul className="space-y-1.5 text-[12px] text-muted">
        {rows.map(([txt, kind]) => (
          <li key={txt} className="flex items-center gap-2.5">
            <LegendIcon kind={kind} />
            {txt}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LegendIcon({ kind }: { kind: string }) {
  if (kind === "line") return <span className="h-[2px] w-4 rounded bg-steel-400" />;
  if (kind === "halo")
    return <span className="h-3 w-3 rounded-full bg-steel-400 ring-2 ring-steel-200" />;
  if (kind === "gap")
    return <span className="h-3 w-3 rounded-full border border-dashed border-[#E0A23C]" />;
  if (kind === "dot2") return <span className="h-3 w-3 rounded-full bg-[#0E7C86]" />;
  return <span className="h-3 w-3 rounded-full bg-steel-600" />;
}
