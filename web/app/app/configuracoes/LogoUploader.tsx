"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { uploadLogo, removeLogo, type LogoResult } from "./actions";

function UploadButton({ onPick }: { onPick: () => void }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg border border-border-2 bg-surface px-4 py-2 text-[14px] font-semibold text-ink transition-colors hover:border-steel-300 hover:text-steel-700 disabled:opacity-50"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
      </svg>
      {pending ? "Enviando…" : "Enviar logo"}
    </button>
  );
}

export default function LogoUploader({
  logoUrl,
  initials,
}: {
  logoUrl: string | null;
  initials: string;
}) {
  const [state, action] = useActionState<LogoResult, FormData>(uploadLogo, {
    ok: true,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div>
      <div className="flex items-center gap-4">
        {/* preview */}
        <span className="grid h-14 w-14 flex-none place-items-center overflow-hidden rounded-2xl bg-metal font-display text-[16px] font-bold text-white shadow-metal">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="logo" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </span>

        <form ref={formRef} action={action} className="flex items-center gap-2.5">
          <input
            ref={inputRef}
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={() => formRef.current?.requestSubmit()}
          />
          <UploadButton onPick={() => inputRef.current?.click()} />
        </form>

        {logoUrl && (
          <form action={removeLogo}>
            <button
              type="submit"
              className="rounded-lg px-3 py-2 text-[13.5px] font-medium text-faint transition-colors hover:text-[#d1495b]"
            >
              Remover
            </button>
          </form>
        )}
      </div>

      {state.error && (
        <p className="mt-2.5 text-[12.5px] font-medium text-[#d1495b]">
          {state.error}
        </p>
      )}
      <p className="mt-2 text-[12.5px] text-faint">
        PNG, JPG, WEBP ou SVG · até 256 KB · quadrado fica melhor.
      </p>
    </div>
  );
}
