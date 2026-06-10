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
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Bucket, SeasonTrendPoint } from "@/lib/analytics";
import { CHART_COLORS as C, ChartCard, tooltipStyle } from "./ChartCard";

const fmt1 = (v: number) => v.toFixed(1);
const fmtPctTick = (v: number) => `${v}%`;

const axisProps = {
  stroke: C.axis,
  fontSize: 11,
  tickLine: false,
  axisLine: { stroke: C.grid },
} as const;

export function ScoringTrendChart({ data }: { data: SeasonTrendPoint[] }) {
  return (
    <ChartCard title="Scoring Trend" sub="Average combined points per game by season">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="ptsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.primary} stopOpacity={0.35} />
              <stop offset="100%" stopColor={C.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="season" {...axisProps} minTickGap={30} />
          <YAxis {...axisProps} domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => [fmt1(Number(v)), "Avg points"]}
            labelFormatter={(l) => `Season ${l}`}
          />
          <Area type="monotone" dataKey="avgPoints" stroke={C.primary} strokeWidth={2} fill="url(#ptsFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function HomeAdvantageChart({ data }: { data: SeasonTrendPoint[] }) {
  return (
    <ChartCard title="Home-Field Advantage" sub="Home win % by season (neutral-site games excluded, ties count half)">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="season" {...axisProps} minTickGap={30} />
          <YAxis {...axisProps} domain={[30, 80]} tickFormatter={fmtPctTick} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => [`${fmt1(Number(v))}%`, "Home win rate"]}
            labelFormatter={(l) => `Season ${l}`}
          />
          <ReferenceLine y={50} stroke={C.reference} strokeDasharray="4 4" />
          <Line type="monotone" dataKey="homeWinPct" stroke={C.secondary} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function BettingTrendChart({ data }: { data: SeasonTrendPoint[] }) {
  const withLines = data.filter((d) => d.favAtsPct !== null || d.overPct !== null);
  return (
    <ChartCard
      title="Betting Market Efficiency"
      sub="Favorite cover rate (ATS) and over hit rate by season — 50% means the market priced it perfectly"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={withLines} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="season" {...axisProps} minTickGap={30} />
          <YAxis {...axisProps} domain={[30, 70]} tickFormatter={fmtPctTick} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v, name) => [`${fmt1(Number(v))}%`, name === "favAtsPct" ? "Favorite covers" : "Over hits"]}
            labelFormatter={(l) => `Season ${l}`}
          />
          <Legend
            formatter={(v) => (
              <span style={{ color: "#a1a1aa", fontSize: 12 }}>
                {v === "favAtsPct" ? "Favorite ATS cover %" : "Over hit %"}
              </span>
            )}
          />
          <ReferenceLine y={50} stroke={C.reference} strokeDasharray="4 4" />
          <Line type="monotone" dataKey="favAtsPct" stroke={C.primary} strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="overPct" stroke={C.tertiary} strokeWidth={2} dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function PointsDistributionChart({ data }: { data: Bucket[] }) {
  return (
    <ChartCard title="Total Points Distribution" sub="Number of games by combined final score">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: "#ffffff0a" }}
            formatter={(v) => [Number(v).toLocaleString(), "Games"]}
            labelFormatter={(l) => `${l} points`}
          />
          <Bar dataKey="games" fill={C.secondary} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function WeatherImpactChart({
  data,
}: {
  data: { label: string; avgPoints: number | null; games: number }[];
}) {
  return (
    <ChartCard title="Weather Impact on Scoring" sub="Average combined points by game-time temperature">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.filter((d) => d.games > 0)} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} domain={[0, "auto"]} />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: "#ffffff0a" }}
            formatter={(v, name, item) => [
              `${fmt1(Number(v))} pts (${item.payload.games.toLocaleString()} games)`,
              "Avg points",
            ]}
          />
          <Bar dataKey="avgPoints" fill={C.tertiary} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
