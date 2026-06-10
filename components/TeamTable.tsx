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
  if (v === null) return <td className="px-3 py-2 text-right text-ink-muted">—</td>;
  const color = v > 52 ? "text-accent" : v < 48 ? "text-neg" : "text-ink";
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
    <div className="rounded-xl border border-edge/50 bg-surface overflow-hidden">
      <div className="p-4 pb-2">
        <h3 className="text-sm font-semibold text-ink">Franchise Performance</h3>
        <p className="text-xs text-ink-muted mt-0.5">
          Records over the filtered games. Click a column to sort. ATS % above 52.4% beats the standard -110 vig.
        </p>
        <p className="text-xs leading-relaxed text-ink-muted mt-1.5">
          <span className="font-medium text-ink-muted">What it&apos;s for: </span>
          Compare teams side by side: who actually wins (Win %), who scores and concedes the most (PF/G, PA/G), who
          beats the bookmakers&apos; expectations (ATS %), and whose games run high-scoring (Over %). Green numbers
          are profitable territory, red is losing.
        </p>
      </div>
      <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-surface">
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
            {sorted.map((s) => (
              <tr key={s.team.id} className="border-b border-edge/30 hover:bg-edge/20">
                <td className="px-3 py-2 text-ink whitespace-nowrap">
                  {s.team.name}
                  <span className="ml-2 text-xs text-ink-muted tabular-nums">
                    {s.wins}-{s.losses}
                    {s.ties > 0 && `-${s.ties}`}
                  </span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-ink-muted">{s.games.toLocaleString()}</td>
                <PctCell v={s.winPct} />
                <td className="px-3 py-2 text-right tabular-nums text-ink">{s.pfPerGame.toFixed(1)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-ink">{s.paPerGame.toFixed(1)}</td>
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
