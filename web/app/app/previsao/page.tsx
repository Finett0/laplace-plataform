import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function PrevisaoPage() {
  return (
    <div className="px-10 py-12">
      <PageHeader title="Previsão" subtitle="Estime a performance antes de publicar." />
      <div className="grid place-items-center rounded-xl border border-dashed border-border-2 bg-surface-2 py-28 text-center">
        <div className="max-w-sm">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-metal text-white shadow-metal">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 17 9 11l4 4 7-8" /><path d="M14 7h6v6" />
            </svg>
          </div>
          <h3 className="mt-4 font-display text-[18px] font-bold text-ink">O pulo do gato</h3>
          <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
            O Agentic Analytics Engineer vai cruzar o grafo da audiência com o algoritmo
            de cada rede para estimar a faixa de performance de cada conteúdo — aqui.
          </p>
        </div>
      </div>
    </div>
  );
}
