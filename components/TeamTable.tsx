"use client";

import { useMemo, useState } from "react";
import { TeamStat } from "@/lib/analytics";

type SortKey = "name" | "games" | "winPct" | "pfPerGame" | "paPerGame" | "atsPct" | "overPct";

const COLS: { key: SortKey; label: string; title?: string }[] = [
  { key: "name", label: "Team" },
  { key: "games", label: "GP" },
  { key: "winPct", label: "Win %" },
  { key: "pfPerGame", label: "PF/G", title: "Points scored per game" },
  { key: "paPerGame", label: "PA/G", title: "Points allowed per game" },
  { key: "atsPct", label: "ATS %", title: "Cover rate against the spread" },
  { key: "overPct", label: "Over %", title: "Share of games going over the total" },
];

function sortValue(s: TeamStat, key: SortKey): string | number {
  if (key === "name") return s.team.name;
  const v = s[key];
  return v === null ? -1 : v;
}

function PctCell({ v }: { v: number | null }) {
  if (v === null) return <td className="px-3 py-2 text-right text-zinc-600">—</td>;
  const color = v > 52 ? "text-emerald-400" : v < 48 ? "text-red-400" : "text-zinc-300";
  return <td className={`px-3 py-2 text-right tabular-nums ${color}`}>{v.toFixed(1)}%</td>;
}

export function TeamTable({ stats }: { stats: TeamStat[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("winPct");
  const [desc, setDesc] = useState(true);

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
      setDesc(key !== "name");
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
      <div className="p-4 pb-2">
        <h3 className="text-sm font-semibold text-zinc-200">Franchise Performance</h3>
        <p className="text-xs text-zinc-500 mt-0.5">
          Records over the filtered games. Click a column to sort. ATS % above 52.4% beats the standard -110 vig.
        </p>
      </div>
      <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-zinc-900">
            <tr className="border-b border-zinc-800">
              {COLS.map((c) => (
                <th
                  key={c.key}
                  title={c.title}
                  onClick={() => onSort(c.key)}
                  className={`px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500 cursor-pointer select-none hover:text-zinc-300 whitespace-nowrap ${
                    c.key === "name" ? "text-left" : "text-right"
                  }`}
                >
                  {c.label}
                  {sortKey === c.key && <span className="ml-1 text-emerald-400">{desc ? "▾" : "▴"}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => (
              <tr key={s.team.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/30">
                <td className="px-3 py-2 text-zinc-200 whitespace-nowrap">
                  {s.team.name}
                  <span className="ml-2 text-xs text-zinc-500 tabular-nums">
                    {s.wins}-{s.losses}
                    {s.ties > 0 && `-${s.ties}`}
                  </span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-zinc-400">{s.games.toLocaleString()}</td>
                <PctCell v={s.winPct} />
                <td className="px-3 py-2 text-right tabular-nums text-zinc-300">{s.pfPerGame.toFixed(1)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-zinc-300">{s.paPerGame.toFixed(1)}</td>
                <PctCell v={s.atsPct} />
                <PctCell v={s.overPct} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
