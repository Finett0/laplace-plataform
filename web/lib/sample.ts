/**
 * Dados de EXEMPLO para a UI renderizar enquanto a ingestão (TikHub →
 * camada 1) não existe. Estruturados para serem trocados por queries reais
 * sem tocar nos componentes. NÃO é dado de produção.
 */

export type Channel = "youtube" | "instagram" | "linkedin";

export const CHANNEL_LABEL: Record<Channel, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  linkedin: "LinkedIn",
};

export type GrowthPoint = { month: string } & Record<Channel, number>;

export const growth: GrowthPoint[] = [
  { month: "jul", youtube: 420, instagram: 1180, linkedin: 240 },
  { month: "ago", youtube: 510, instagram: 980, linkedin: 320 },
  { month: "set", youtube: 480, instagram: 1320, linkedin: 410 },
  { month: "out", youtube: 620, instagram: 1610, linkedin: 560 },
  { month: "nov", youtube: 580, instagram: 1490, linkedin: 880 },
  { month: "dez", youtube: 700, instagram: 1720, linkedin: 1240 },
  { month: "jan", youtube: 760, instagram: 1880, linkedin: 1610 },
  { month: "fev", youtube: 690, instagram: 2010, linkedin: 1980 },
  { month: "mar", youtube: 820, instagram: 2240, linkedin: 2460 },
  { month: "abr", youtube: 910, instagram: 2380, linkedin: 3120 },
  { month: "mai", youtube: 870, instagram: 2510, linkedin: 2890 },
  { month: "jun", youtube: 980, instagram: 2680, linkedin: 3340 },
];

export type Content = {
  title: string;
  channel: Channel;
  theme: string;
  engagement: number;
  trend: number;
};

export const topContent: Content[] = [
  { title: "Poder é igual sabonete: se você usar demais, acaba.", channel: "instagram", theme: "história empresarial", engagement: 11972, trend: 0.23 },
  { title: "Francisco Gomes Neto completa 7 anos como CEO da Embraer.", channel: "linkedin", theme: "história empresarial", engagement: 7390, trend: 0.41 },
  { title: "Edmond Safra: a mente mais brilhante do mundo bancário.", channel: "youtube", theme: "história empresarial", engagement: 4875, trend: 0.12 },
  { title: "Construindo abundância na América Latina com Hernan Kazah.", channel: "youtube", theme: "fundraising", engagement: 3705, trend: 0.08 },
  { title: "BTG Pactual completa 14 anos do IPO.", channel: "linkedin", theme: "mercado", engagement: 2660, trend: 0.31 },
  { title: "O papel do conteúdo longo para construir confiança.", channel: "instagram", theme: "marketing", engagement: 2410, trend: -0.05 },
  { title: "IA aplicada a produto: o que muda na prática.", channel: "linkedin", theme: "IA aplicada", engagement: 1980, trend: 0.62 },
  { title: "Métricas que importam num early stage.", channel: "youtube", theme: "métricas / KPIs", engagement: 1340, trend: 0.17 },
];

export function kpis() {
  const totalEng = growth.reduce((a, g) => a + g.youtube + g.instagram + g.linkedin, 0);
  return {
    conteudos: 150,
    engajamento: totalEng,
    curtidas: Math.round(totalEng * 0.94),
    comentarios: Math.round(totalEng * 0.06),
    alcancePrevisto: 48200,
    alcanceDelta: 0.12,
    superFas: 1263,
    conectores: 46,
  };
}

export const briefing = {
  headline:
    "Instagram concentra 62% do engajamento com 1/3 das peças — puxado por Reels de história empresarial.",
  bullets: [
    "Instagram lidera: 19.209 de engajamento em 50 peças; Reels sozinhos somam 17.198 (90% do canal).",
    "História empresarial domina volume e topo, mas IA aplicada vira ponte forte com só 38 peças.",
    "Gap de eficiência no YouTube: 50 peças geram 4.562; LinkedIn rende mais (7.165) no mesmo volume.",
  ],
};

export type Insight = { type: "up" | "gap" | "cross"; title: string; body: string };

export const insights: Insight[] = [
  { type: "up", title: "Instagram puxa o engajamento", body: "Reels de história empresarial rendem 2,3× a média. Dobre a aposta no formato." },
  { type: "gap", title: "IA aplicada subexplorada", body: "Tema com alta atenção por peça e pouco volume. A audiência pede, você não cobre." },
  { type: "cross", title: "História empresarial cross-canal", body: "Explode no Instagram e rende no LinkedIn — leve os mesmos cortes para o YouTube." },
];

export type Person = {
  name: string;
  headline: string;
  company: string;
  segment: string;
  reactions: number;
};

export const audienceTotals = { people: 1263, reactions: 1487 };

export const segments = [
  { label: "Founders & C-level", share: 0.33 },
  { label: "Investidores / VC / M&A", share: 0.24 },
  { label: "Estratégia, Vendas & Growth", share: 0.17 },
  { label: "IA & Tecnologia / Engenharia", share: 0.14 },
  { label: "Produto, Marketing & RH", share: 0.08 },
  { label: "Início de carreira / Estudantes", share: 0.04 },
];

export const people: Person[] = [
  { name: "Regis Mello", headline: "Founder & CEO at Kortex", company: "Kortex", segment: "Founders & C-level", reactions: 38 },
  { name: "Marcos Vinícius", headline: "Partner at Kaszek Ventures", company: "Kaszek", segment: "Investidores / VC / M&A", reactions: 31 },
  { name: "Luciana Prado", headline: "Head of Growth at Nubank", company: "Nubank", segment: "Estratégia, Vendas & Growth", reactions: 27 },
  { name: "Salvador Reis", headline: "CTO at Galileu Saúde", company: "Galileu Saúde", segment: "IA & Tecnologia / Engenharia", reactions: 24 },
  { name: "Cadu Almeida", headline: "Co-founder at Arme.inc", company: "Arme.inc", segment: "Founders & C-level", reactions: 22 },
  { name: "Guilherme Tavares", headline: "Investment Manager at BTG Pactual", company: "BTG Pactual", segment: "Investidores / VC / M&A", reactions: 19 },
  { name: "Leonardo Castro", headline: "VP Product at iFood", company: "iFood", segment: "Produto, Marketing & RH", reactions: 17 },
  { name: "Sonali Mehta", headline: "ML Engineer at Anthropic", company: "Anthropic", segment: "IA & Tecnologia / Engenharia", reactions: 15 },
  { name: "Rodrigo Lima", headline: "Founder at Iniciador", company: "Iniciador", segment: "Founders & C-level", reactions: 13 },
  { name: "Mário Bezerra", headline: "Director of Sales at Pipefy", company: "Pipefy", segment: "Estratégia, Vendas & Growth", reactions: 11 },
];

/* ───────── Grafo (Pilar 2) — dados de exemplo ───────── */

export type ThemeNode = {
  id: string;
  label: string;
  cluster: number;
  pieces: number;
  channels: Channel[];
  isBridge?: boolean;
  isGap?: boolean;
};
export type GraphLink = { source: string; target: string; weight: number };

export const themeNodes: ThemeNode[] = [
  { id: "historia", label: "história empresarial", cluster: 0, pieces: 97, channels: ["instagram", "linkedin", "youtube"], isBridge: true },
  { id: "mindset", label: "mindset founder", cluster: 0, pieces: 45, channels: ["instagram", "linkedin"] },
  { id: "lideranca", label: "liderança", cluster: 0, pieces: 28, channels: ["linkedin"] },
  { id: "gestao", label: "gestão", cluster: 0, pieces: 24, channels: ["linkedin", "youtube"] },
  { id: "ia-aplicada", label: "IA aplicada", cluster: 1, pieces: 38, channels: ["linkedin", "youtube"], isBridge: true },
  { id: "produto", label: "produto", cluster: 1, pieces: 60, channels: ["linkedin", "youtube", "instagram"] },
  { id: "metricas", label: "métricas / KPIs", cluster: 1, pieces: 26, channels: ["linkedin"] },
  { id: "growth", label: "growth", cluster: 1, pieces: 18, channels: ["linkedin", "instagram"] },
  { id: "valuation", label: "valuation", cluster: 2, pieces: 22, channels: ["linkedin"] },
  { id: "captacao", label: "captação", cluster: 2, pieces: 19, channels: ["linkedin", "youtube"] },
  { id: "fundraising", label: "fundraising internacional", cluster: 2, pieces: 12, channels: ["youtube"] },
  { id: "venture-capital", label: "venture capital", cluster: 2, pieces: 9, channels: ["youtube"] },
  { id: "time-cultura", label: "time / cultura", cluster: 3, pieces: 20, channels: ["instagram", "linkedin"] },
  { id: "marketing", label: "marketing", cluster: 3, pieces: 30, channels: ["instagram"] },
  { id: "tendencias", label: "tendências", cluster: 4, pieces: 6, channels: ["instagram"], isGap: true },
  { id: "cap-table", label: "cap table", cluster: 2, pieces: 2, channels: ["linkedin"], isGap: true },
  { id: "networking", label: "networking", cluster: 4, pieces: 5, channels: ["instagram", "linkedin"] },
];

export const themeLinks: GraphLink[] = [
  { source: "historia", target: "mindset", weight: 6 },
  { source: "historia", target: "ia-aplicada", weight: 4 },
  { source: "historia", target: "produto", weight: 5 },
  { source: "historia", target: "gestao", weight: 3 },
  { source: "historia", target: "lideranca", weight: 3 },
  { source: "historia", target: "valuation", weight: 2 },
  { source: "historia", target: "marketing", weight: 2 },
  { source: "ia-aplicada", target: "produto", weight: 5 },
  { source: "ia-aplicada", target: "metricas", weight: 3 },
  { source: "ia-aplicada", target: "growth", weight: 2 },
  { source: "ia-aplicada", target: "tendencias", weight: 1 },
  { source: "produto", target: "metricas", weight: 4 },
  { source: "produto", target: "growth", weight: 3 },
  { source: "produto", target: "time-cultura", weight: 2 },
  { source: "produto", target: "marketing", weight: 2 },
  { source: "valuation", target: "captacao", weight: 4 },
  { source: "valuation", target: "fundraising", weight: 3 },
  { source: "valuation", target: "venture-capital", weight: 2 },
  { source: "valuation", target: "cap-table", weight: 1 },
  { source: "captacao", target: "fundraising", weight: 4 },
  { source: "captacao", target: "venture-capital", weight: 3 },
  { source: "fundraising", target: "venture-capital", weight: 2 },
  { source: "growth", target: "marketing", weight: 3 },
  { source: "growth", target: "metricas", weight: 2 },
  { source: "time-cultura", target: "lideranca", weight: 3 },
  { source: "lideranca", target: "gestao", weight: 3 },
  { source: "gestao", target: "mindset", weight: 2 },
  { source: "mindset", target: "lideranca", weight: 2 },
  { source: "marketing", target: "tendencias", weight: 1 },
  { source: "networking", target: "fundraising", weight: 1 },
  { source: "networking", target: "mindset", weight: 1 },
];

export type PersonNode = { id: string; label: string; cluster: number; reactions: number };

/** Rede de co-engajamento (determinística, seed fixa). */
export function buildAudienceGraph(): { nodes: PersonNode[]; links: GraphLink[] } {
  const names = [
    "Regis", "Marcos", "Luciana", "Salvador", "Cadu", "Guilherme", "Leonardo",
    "Sonali", "Rodrigo", "Mário", "Beatriz", "Henrique", "Tatiana", "Vitor",
    "Camila", "André", "Patrícia", "Fernando", "Renata", "Diego", "Larissa",
    "Otávio", "Juliana", "Bruno", "Carolina", "Thiago", "Marina", "Eduardo",
  ];
  const nodes: PersonNode[] = names.map((n, i) => ({
    id: "p" + i,
    label: n,
    cluster: i % 6,
    reactions: 3 + ((i * 7) % 18),
  }));
  const links: GraphLink[] = [];
  // dentro do cluster: liga vizinhos; cross: liga pontes esparsas
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const same = nodes[i].cluster === nodes[j].cluster;
      const bond = (i * 31 + j * 17) % 100;
      if (same && bond < 35) links.push({ source: nodes[i].id, target: nodes[j].id, weight: 1 + (bond % 3) });
      else if (!same && bond < 6) links.push({ source: nodes[i].id, target: nodes[j].id, weight: 1 });
    }
  }
  return { nodes, links };
}

export const CLUSTER_COLORS = ["#1857A0", "#3F8FD6", "#0E7C86", "#5566A6", "#6FB1EC", "#8AA0C8"];

export const nf = new Intl.NumberFormat("pt-BR");
export const pct = (n: number) =>
  `${n >= 0 ? "+" : ""}${(n * 100).toFixed(0)}%`;
