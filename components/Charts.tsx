"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SeasonPoint } from "@/lib/analytics";
import { ChartCard } from "./ChartCard";
import { useChartColors } from "./theme";

const fmt1 = (v: number) => v.toFixed(1);
const fmtPctTick = (v: number) => `${v}%`;

function useAxisProps() {
  const c = useChartColors();
  return {
    stroke: c.axis,
    fontSize: 11,
    tickLine: false,
    axisLine: { stroke: c.grid },
  } as const;
}

export function PointsBySeasonChart({ data, entityName }: { data: SeasonPoint[]; entityName: string | null }) {
  const c = useChartColors();
  const axisProps = useAxisProps();
  return (
    <ChartCard
      title="Points by Season"
      sub={entityName ? `Championship points scored by ${entityName} each season` : "Total championship points awarded each season (all filtered entries)"}
      info="Tracks scoring across seasons. With a driver or constructor selected this is their career arc — peaks are title campaigns, cliffs are car or team changes. Note that scoring systems changed over the years (10-6-4-3-2-1 became 25-18-15… in 2010), so compare shapes within an era, not raw points across eras."
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
          <defs>
            <linearGradient id="ptsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.primary} stopOpacity={0.35} />
              <stop offset="100%" stopColor={c.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis dataKey="season" {...axisProps} minTickGap={30} />
          <YAxis {...axisProps} domain={[0, "auto"]} />
          <Tooltip
            contentStyle={c.tooltip}
            formatter={(v) => [Number(v).toLocaleString(), "Points"]}
            labelFormatter={(l) => `Season ${l}`}
          />
          <Area type="monotone" dataKey="points" stroke={c.primary} strokeWidth={2} fill="url(#ptsFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ReliabilityChart({ data }: { data: SeasonPoint[] }) {
  const c = useChartColors();
  const axisProps = useAxisProps();
  return (
    <ChartCard
      title="Reliability & Attrition"
      sub="Share of entries not finishing, by season — mechanical failures vs on-track incidents"
      info="The engineering KPI. Mechanical DNFs falling from ~30% in the 20th century to under 5% today shows how bulletproof modern cars are. A team or era with a high mechanical line is losing points to fragility; a high incident line points to crash-prone drivers or chaotic seasons."
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis dataKey="season" {...axisProps} minTickGap={30} />
          <YAxis {...axisProps} domain={[0, "auto"]} tickFormatter={fmtPctTick} />
          <Tooltip
            contentStyle={c.tooltip}
            formatter={(v, name) => [`${fmt1(Number(v))}%`, name === "mechPct" ? "Mechanical DNF" : "Incident DNF"]}
            labelFormatter={(l) => `Season ${l}`}
          />
          <Legend
            formatter={(v) => (
              <span style={{ color: c.axis, fontSize: 12 }}>{v === "mechPct" ? "Mechanical DNF %" : "Incident DNF %"}</span>
            )}
          />
          <Line type="monotone" dataKey="mechPct" stroke={c.tertiary} strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="incidentPct" stroke={c.secondary} strokeWidth={2} dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function GridToFinishChart({ data }: { data: { grid: number; avgFinish: number | null; entries: number }[] }) {
  const c = useChartColors();
  const axisProps = useAxisProps();
  return (
    <ChartCard
      title="Grid Slot vs Average Finish"
      sub="Average classified finishing position from each starting position"
      info="Shows how much qualifying matters. The gap between a bar's height and its grid number is the average ground gained or lost in the race: bars below the diagonal mean drivers starting there typically move forward. With a driver selected, bars well below their grid slot are the signature of a strong racer."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.filter((d) => d.entries > 0)} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis dataKey="grid" {...axisProps} />
          <YAxis {...axisProps} domain={[0, "auto"]} />
          <Tooltip
            contentStyle={c.tooltip}
            cursor={{ fill: c.cursorFill }}
            formatter={(v, name, item) => [
              `Avg finish P${fmt1(Number(v))} (${item.payload.entries.toLocaleString()} starts)`,
              `From grid P${item.payload.grid}`,
            ]}
            labelFormatter={() => ""}
          />
          <Bar dataKey="avgFinish" fill={c.secondary} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function PitStopChart({ data }: { data: SeasonPoint[] }) {
  const c = useChartColors();
  const axisProps = useAxisProps();
  const withPits = data.filter((d) => d.avgPitS !== null);
  return (
    <ChartCard
      title="Pit Stop Performance"
      sub="Average pit-lane time per stop by season, entry to exit (data available from 2011)"
      info="The pit crew and strategy KPI. This is full pit-lane time — the speed-limited drive-through plus the 2–3s stationary stop — so circuit layouts and pit-lane speed limits move it as much as crew speed. A team trending above the field average is leaking race time on every stop. Red-flag stops over 60s are excluded."
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={withPits} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis dataKey="season" {...axisProps} minTickGap={20} />
          <YAxis {...axisProps} domain={[0, "auto"]} tickFormatter={(v) => `${v}s`} />
          <Tooltip
            contentStyle={c.tooltip}
            formatter={(v) => [`${fmt1(Number(v))} s`, "Avg pit-lane time"]}
            labelFormatter={(l) => `Season ${l}`}
          />
          <Line type="monotone" dataKey="avgPitS" stroke={c.primary} strokeWidth={2} dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function FinishDistributionChart({ data }: { data: { label: string; entries: number }[] }) {
  const c = useChartColors();
  const axisProps = useAxisProps();
  return (
    <ChartCard
      title="Finishing Position Distribution"
      sub="Where the filtered entries ended up"
      info="A quick shape of competitiveness. For a top driver the P1 and P2–P3 bars dominate; for a midfield team most results pile into P7–P10. A tall DNF bar relative to the rest is a reliability or crash problem worth investigating with the status filter."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip
            contentStyle={c.tooltip}
            cursor={{ fill: c.cursorFill }}
            formatter={(v) => [Number(v).toLocaleString(), "Entries"]}
          />
          <Bar dataKey="entries" fill={c.tertiary} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
