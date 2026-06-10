"use client";

import { useMemo, useState } from "react";
import { StandingRow } from "@/lib/analytics";

type SortKey = "name" | "entries" | "wins" | "podiums" | "poles" | "points" | "pointsPerEntry" | "avgFinish" | "dnfPct";

const COLS: { key: SortKey; label: string; title?: string }[] = [
  { key: "name", label: "Name" },
  { key: "entries", label: "Entries", title: "Race entries in the filtered set" },
  { key: "wins", label: "Wins" },
  { key: "podiums", label: "Podiums", title: "Top-3 finishes" },
  { key: "poles", label: "Poles", title: "Qualifying P1 (grid P1 for pre-1994 seasons)" },
  { key: "points", label: "Points" },
  { key: "pointsPerEntry", label: "Pts/Race" },
  { key: "avgFinish", label: "Avg Finish", title: "Average classified finishing position" },
  { key: "dnfPct", label: "DNF %", title: "Mechanical + incident retirements" },
];

function sortValue(s: StandingRow, key: SortKey): string | number {
  if (key === "name") return s.name;
  const v = s[key];
  return v === null ? (key === "avgFinish" ? 999 : -1) : v;
}

export function StandingsTable({ drivers, constructors }: { drivers: StandingRow[]; constructors: StandingRow[] }) {
  const [mode, setMode] = useState<"drivers" | "constructors">("drivers");
  const [sortKey, setSortKey] = useState<SortKey>("points");
  const [desc, setDesc] = useState(true);

  const stats = mode === "drivers" ? drivers : constructors;
  const sorted = useMemo(() => {
    return [...stats].sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return desc ? -cmp : cmp;
    });
  }, [stats, sortKey, desc]);

  const onSort = (key: SortKey) => {
    if (key === sortKey) setDesc(!desc);
    else {
      setSortKey(key);
      setDesc(key !== "name" && key !== "avgFinish");
    }
  };

  const tabCls = (active: boolean) =>
    `px-3 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
      active ? "border-accent text-accent" : "border-edge text-ink-muted hover:text-ink hover:border-ink-muted"
    }`;

  return (
    <div className="rounded-xl border border-edge/50 bg-surface overflow-hidden">
      <div className="p-4 pb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-ink">Championship Table</h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Aggregated over the filtered entries. Click a column to sort.
          </p>
        </div>
        <div className="flex gap-2">
          <button className={tabCls(mode === "drivers")} onClick={() => setMode("drivers")}>
            Drivers
          </button>
          <button className={tabCls(mode === "constructors")} onClick={() => setMode("constructors")}>
            Constructors
          </button>
        </div>
      </div>
      <p className="px-4 pb-2 text-xs leading-relaxed text-ink-muted">
        <span className="font-medium text-ink-muted">What it&apos;s for: </span>
        Rank anyone by any metric: raw success (Wins, Podiums, Points), one-lap pace (Poles), consistency (Pts/Race,
        Avg Finish) and reliability (DNF %). Pts/Race is the fairest cross-era comparison because calendars grew from
        7 races in 1950 to 24 today.
      </p>
      <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-surface z-10">
            <tr className="border-b border-edge/50">
              {COLS.map((c) => (
                <th
                  key={c.key}
                  title={c.title}
                  onClick={() => onSort(c.key)}
                  className={`px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-ink-muted cursor-pointer select-none hover:text-ink whitespace-nowrap ${
                    c.key === "name" ? "text-left" : "text-right"
                  }`}
                >
                  {c.label}
                  {sortKey === c.key && <span className="ml-1 text-accent">{desc ? "▾" : "▴"}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, 100).map((s) => (
              <tr key={`${mode}-${s.idx}`} className="border-b border-edge/30 hover:bg-edge/20">
                <td className="px-3 py-2 text-ink whitespace-nowrap">
                  {s.name}
                  <span className="ml-2 text-xs text-ink-muted">{s.sub}</span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-ink-muted">{s.entries.toLocaleString()}</td>
                <td className="px-3 py-2 text-right tabular-nums text-ink">{s.wins}</td>
                <td className="px-3 py-2 text-right tabular-nums text-ink">{s.podiums}</td>
                <td className="px-3 py-2 text-right tabular-nums text-ink">{s.poles}</td>
                <td className="px-3 py-2 text-right tabular-nums text-accent">{s.points.toLocaleString()}</td>
                <td className="px-3 py-2 text-right tabular-nums text-ink">{s.pointsPerEntry.toFixed(2)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-ink">
                  {s.avgFinish === null ? "—" : s.avgFinish.toFixed(1)}
                </td>
                <td className={`px-3 py-2 text-right tabular-nums ${s.dnfPct !== null && s.dnfPct > 30 ? "text-neg" : "text-ink"}`}>
                  {s.dnfPct === null ? "—" : `${s.dnfPct.toFixed(1)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length > 100 && (
        <p className="px-4 py-2 text-xs text-ink-muted border-t border-edge/30">
          Showing top 100 of {sorted.length.toLocaleString()} — narrow the filters to see the rest.
        </p>
      )}
    </div>
  );
}
