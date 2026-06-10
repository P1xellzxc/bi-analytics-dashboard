"use client";

import { Comeback } from "@/lib/analytics";

export function ComebackTable({ rows }: { rows: Comeback[] }) {
  return (
    <div className="rounded-xl border border-edge/50 bg-surface overflow-hidden flex flex-col">
      <div className="p-3 sm:p-4 pb-2">
        <h3 className="text-sm font-semibold text-ink">Greatest Comeback Drives</h3>
        <p className="text-xs text-ink-muted mt-0.5">Biggest grid-to-finish climbs in the filtered entries</p>
      </div>
      <div className="overflow-x-auto overflow-y-auto flex-1 max-h-96">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-surface z-10">
            <tr className="border-b border-edge/50">
              <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-ink-muted text-left">Driver</th>
              <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-ink-muted text-left">Race</th>
              <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-ink-muted text-right whitespace-nowrap">Grid → Finish</th>
              <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-ink-muted text-right">Gained</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-edge/30 hover:bg-edge/20">
                <td className="px-3 py-2 text-ink whitespace-nowrap">
                  {r.driver}
                  <span className="ml-2 text-xs text-ink-muted">{r.constructor}</span>
                </td>
                <td className="px-3 py-2 text-ink-muted whitespace-nowrap">
                  {r.year} {r.race}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-ink whitespace-nowrap">
                  P{r.grid} → P{r.finish}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-accent font-medium">+{r.gained}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-xs text-ink-muted">
                  No comeback drives in the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="px-3 sm:px-4 py-2.5 text-xs leading-relaxed text-ink-muted border-t border-edge/50">
        <span className="font-medium text-ink-muted">What it&apos;s for: </span>
        The raw material of overtaking legend — who climbed furthest through the field in a single race. Combine with
        the circuit filter to see where comebacks are even possible, or a driver filter for their career-best drives.
      </p>
    </div>
  );
}
