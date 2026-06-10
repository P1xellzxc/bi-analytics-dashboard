interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}

export function KpiCard({ label, value, sub, accent }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</span>
      <span className={`text-2xl font-semibold tabular-nums ${accent ? "text-emerald-400" : "text-zinc-100"}`}>
        {value}
      </span>
      {sub && <span className="text-xs text-zinc-500">{sub}</span>}
    </div>
  );
}

export function fmtPct(v: number | null): string {
  return v === null ? "—" : `${v.toFixed(1)}%`;
}

export function fmtNum(v: number | null, digits = 1): string {
  return v === null ? "—" : v.toFixed(digits);
}
