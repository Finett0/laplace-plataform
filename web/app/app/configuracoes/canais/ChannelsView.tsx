"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import type { ConnectedChannel } from "@/lib/db/schema";
import { addChannel, removeChannel, toggleChannel } from "./actions";
import { PLATFORMS, type Platform, type ActionResult } from "./platforms";

const META: Record<Platform, { label: string; dot: string; hint: string }> = {
  youtube: { label: "YouTube", dot: "bg-steel-700", hint: "@canal ou URL" },
  instagram: { label: "Instagram", dot: "bg-steel-400", hint: "usuário ou URL" },
  linkedin: { label: "LinkedIn", dot: "bg-steel-500", hint: "usuário ou URL" },
  x: { label: "X / Twitter", dot: "bg-steel-600", hint: "usuário ou URL" },
  tiktok: { label: "TikTok", dot: "bg-steel-800", hint: "@usuário ou URL" },
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="metal metal-sheen inline-flex h-[42px] flex-none items-center gap-2 rounded-lg px-5 text-[14px] font-semibold text-white disabled:opacity-50"
    >
      {pending ? "Conectando…" : "Conectar"}
    </button>
  );
}

export default function ChannelsView({
  tenantName,
  channels,
}: {
  tenantName: string;
  channels: ConnectedChannel[];
}) {
  const [state, formAction] = useActionState<ActionResult, FormData>(addChannel, {
    ok: true,
  });
  const formRef = useRef<HTMLFormElement>(null);

  // limpa o input do handle após sucesso
  useEffect(() => {
    if (state.ok && !state.error) formRef.current?.reset();
  }, [state]);

  return (
    <div>
      <div className="mb-1 text-[14px] font-semibold text-ink">
        Canais conectados
      </div>
      <div className="mb-4 text-[13px] text-muted">
        Conecte os canais de {tenantName} — o que a extração vai puxar.
      </div>

      {/* formulário de conexão */}
      <form
        ref={formRef}
        action={formAction}
        className="rounded-xl border border-border bg-surface p-4 shadow-sm"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-none">
            <select
              name="platform"
              defaultValue="youtube"
              className="h-[42px] w-full appearance-none rounded-lg border border-border-2 bg-surface-2 pl-3.5 pr-9 text-[14px] font-medium text-ink focus:border-steel-300 focus:outline-none sm:w-[170px]"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {META[p].label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint">
              ⌄
            </span>
          </div>

          <input
            name="handle"
            placeholder="@handle, usuário ou URL do canal"
            autoComplete="off"
            className="h-[42px] flex-1 rounded-lg border border-border-2 bg-surface-2 px-3.5 text-[14px] text-ink placeholder:text-faint focus:border-steel-300 focus:outline-none"
          />

          <SubmitButton />
        </div>

        {state.error && (
          <p className="mt-2.5 text-[12.5px] font-medium text-[#d1495b]">
            {state.error}
          </p>
        )}
      </form>

      {/* lista de canais conectados */}
      <div className="mt-6 rounded-xl border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="font-display text-[13px] font-semibold uppercase tracking-[.16em] text-faint">
            Conectados
          </h2>
          <span className="text-[12.5px] tabular-nums text-faint">
            {channels.length} {channels.length === 1 ? "canal" : "canais"}
          </span>
        </div>

        {channels.length === 0 ? (
          <div className="px-5 py-14 text-center text-[13.5px] text-faint">
            Nenhum canal conectado ainda. Adicione o primeiro acima.
          </div>
        ) : (
          <ul>
            {channels.map((c) => {
              const m = META[c.platform as Platform];
              const paused = c.status === "paused";
              return (
                <li
                  key={c.id}
                  className="flex items-center gap-4 border-b border-border px-5 py-3.5 last:border-0"
                >
                  <span className={`h-2.5 w-2.5 flex-none rounded-full ${m.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-ink">
                        {c.handle}
                      </span>
                      {paused && (
                        <span className="rounded-full bg-steel-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-faint">
                          pausado
                        </span>
                      )}
                    </div>
                    <div className="text-[12.5px] text-faint">
                      {m.label}
                      {c.externalId ? ` · id ${c.externalId}` : ""}
                    </div>
                  </div>

                  <form action={toggleChannel}>
                    <input type="hidden" name="id" value={c.id} />
                    <input
                      type="hidden"
                      name="next"
                      value={paused ? "active" : "paused"}
                    />
                    <button
                      type="submit"
                      className="rounded-lg border border-border-2 px-3 py-1.5 text-[12.5px] font-medium text-muted transition-colors hover:border-steel-300 hover:text-steel-700"
                    >
                      {paused ? "Retomar" : "Pausar"}
                    </button>
                  </form>

                  <form action={removeChannel}>
                    <input type="hidden" name="id" value={c.id} />
                    <button
                      type="submit"
                      title="Remover"
                      className="grid h-8 w-8 place-items-center rounded-lg text-faint transition-colors hover:bg-[#fdecee] hover:text-[#d1495b]"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13" />
                      </svg>
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="mt-6 text-[12.5px] text-faint">
        Cada canal aqui vira input da camada de extração (TikHub) — resolve o
        handle → id interno → puxa o conteúdo. Isolado por organização.
      </p>
    </div>
  );
}
