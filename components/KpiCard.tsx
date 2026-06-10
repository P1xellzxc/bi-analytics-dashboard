interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  info?: string;
}

export function KpiCard({ label, value, sub, accent, info }: KpiCardProps) {
  return (
    <div className="group relative rounded-xl border border-edge/50 bg-surface p-4 flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted flex items-center gap-1">
        {label}
        {info && (
          <span
            className="cursor-help text-ink-muted group-hover:text-ink transition-colors normal-case tracking-normal"
            aria-label={info}
          >
            ⓘ
          </span>
        )}
      </span>
      <span className={`text-2xl font-semibold tabular-nums ${accent ? "text-accent" : "text-ink"}`}>
        {value}
      </span>
      {sub && <span className="text-xs text-ink-muted">{sub}</span>}
      {info && (
        <div className="pointer-events-none absolute left-2 right-2 top-full mt-1 z-20 hidden group-hover:block rounded-lg border border-edge bg-surface p-2.5 text-xs leading-relaxed text-ink shadow-xl">
          {info}
        </div>
      )}
    </div>
  );
}

export function fmtPct(v: number | null): string {
  return v === null ? "—" : `${v.toFixed(1)}%`;
}

export function fmtNum(v: number | null, digits = 1): string {
  return v === null ? "—" : v.toFixed(digits);
}
