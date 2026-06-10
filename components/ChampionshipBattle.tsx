"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Dataset } from "@/lib/types";
import { useChartColors } from "./theme";

export function ChampionshipBattle({ data }: { data: Dataset }) {
  const c = useChartColors();
  const years = data.battles.map((b) => b.y);
  const [year, setYear] = useState(years[years.length - 1]);
  const [mode, setMode] = useState<"drivers" | "constructors">("drivers");

  const battle = data.battles.find((b) => b.y === year)!;
  const series = mode === "drivers" ? battle.d : battle.c;
  const nameOf = (i: number) => (mode === "drivers" ? data.drivers[i].name : data.constructors[i].name);

  const { chartData, stats } = useMemo(() => {
    const rows = battle.races.map((race, r) => {
      const row: Record<string, number | string> = { round: r + 1, race };
      for (const s of series) row[nameOf(s.i)] = s.p[r] ?? 0;
      return row;
    });
    // Lead changes: how often the championship leader differs from the previous round's.
    let leadChanges = 0;
    let prevLeader = -1;
    for (let r = 0; r < battle.races.length; r++) {
      let leader = -1;
      let best = -1;
      for (const s of series) {
        const v = s.p[r] ?? 0;
        if (v > best) {
          best = v;
          leader = s.i;
        }
      }
      if (prevLeader !== -1 && leader !== prevLeader) leadChanges++;
      if (leader !== -1) prevLeader = leader;
    }
    const final = [...series].sort((a, b) => (b.p[b.p.length - 1] ?? 0) - (a.p[a.p.length - 1] ?? 0));
    const champion = final[0] ? nameOf(final[0].i) : "—";
    const margin =
      final.length > 1 ? (final[0].p[final[0].p.length - 1] ?? 0) - (final[1].p[final[1].p.length - 1] ?? 0) : 0;
    return { chartData: rows, stats: { champion, margin: Math.round(margin * 100) / 100, leadChanges } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battle, mode]);

  const tabCls = (active: boolean) =>
    `px-3 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
      active ? "border-accent text-accent" : "border-edge text-ink-muted hover:text-ink hover:border-ink-muted"
    }`;

  return (
    <div className="rounded-xl border border-edge/50 bg-surface p-3 sm:p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-ink">Championship Battle</h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Cumulative points by round for the season&apos;s top {mode === "drivers" ? "drivers" : "constructors"}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button className={tabCls(mode === "drivers")} onClick={() => setMode("drivers")}>
            Drivers
          </button>
          <button className={tabCls(mode === "constructors")} onClick={() => setMode("constructors")}>
            Constructors
          </button>
          <select
            className="bg-surface border border-edge rounded-lg px-2.5 py-1 text-xs text-ink outline-none focus:border-accent hover:border-ink-muted transition-colors cursor-pointer"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {[...years].reverse().map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="px-2.5 py-1 rounded-lg bg-base text-ink">
          🏆 <span className="font-semibold text-accent">{stats.champion}</span>
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-base text-ink-muted">
          Final margin <span className="text-ink font-medium tabular-nums">{stats.margin} pts</span>
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-base text-ink-muted">
          Lead changes <span className="text-ink font-medium tabular-nums">{stats.leadChanges}</span>
        </span>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
            <CartesianGrid stroke={c.grid} vertical={false} />
            <XAxis dataKey="round" stroke={c.axis} fontSize={11} tickLine={false} axisLine={{ stroke: c.grid }} />
            <YAxis stroke={c.axis} fontSize={11} tickLine={false} axisLine={{ stroke: c.grid }} domain={[0, "auto"]} />
            <Tooltip
              contentStyle={c.tooltip}
              labelFormatter={(l, payload) => `Round ${l} · ${payload?.[0]?.payload?.race ?? ""}`}
              formatter={(v, name) => [Number(v).toLocaleString(), name]}
            />
            <Legend formatter={(v) => <span style={{ color: c.axis, fontSize: 11 }}>{v}</span>} />
            {series.map((s, k) => (
              <Line
                key={s.i}
                type="monotone"
                dataKey={nameOf(s.i)}
                stroke={c.series[k % c.series.length]}
                strokeWidth={k === 0 ? 2.5 : 1.8}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs leading-relaxed text-ink-muted border-t border-edge/50 pt-2.5">
        <span className="font-medium text-ink-muted">What it&apos;s for: </span>
        The title fight, round by round. Converging lines mean a close season; an early separation means dominance.
        Lead changes count how often the championship lead swapped hands — the 2021 drivers&apos; fight or 2007&apos;s
        three-way battle make great examples. This panel shows complete seasons and ignores the filters above.
      </p>
    </div>
  );
}
