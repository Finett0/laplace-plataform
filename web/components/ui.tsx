import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6">
      <div className="animate-rise">
        <h1 className="font-display text-[30px] font-bold tracking-[-.025em] text-ink">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-[14.5px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="font-display text-[12px] font-semibold uppercase tracking-[.18em] text-faint">
      {children}
    </div>
  );
}

export function Delta({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={`text-[12px] font-semibold tabular-nums ${
        up ? "text-positive" : "text-[#d1495b]"
      }`}
    >
      {up ? "▲" : "▼"} {Math.abs(value * 100).toFixed(0)}%
    </span>
  );
}

const CH_DOT: Record<string, string> = {
  youtube: "bg-steel-700",
  instagram: "bg-steel-400",
  linkedin: "bg-steel-500",
};

export function ChannelDot({ channel }: { channel: string }) {
  return (
    <span
      className={`inline-block h-2 w-2 flex-none rounded-full ${
        CH_DOT[channel] ?? "bg-steel-400"
      }`}
    />
  );
}
