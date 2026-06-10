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
    <ChartCard
      title="Scoring Trend"
      sub="Average combined points per game by season"
      info="Shows whether the league is becoming more or less offense-friendly over time. Rising lines usually follow rule changes that help offenses. Useful for putting any single season or team in context, and for judging whether over/under lines should trend up or down."
    >
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
    <ChartCard
      title="Home-Field Advantage"
      sub="Home win % by season (neutral-site games excluded, ties count half)"
      info="Measures how much playing at home is worth. Anything above the 50% dashed line means home teams win more than they lose. Watch for the long-term decline — and the dip in 2020 when stadiums were empty — when deciding how much weight to give the home team in a prediction or a bet."
    >
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
      info="Tests how accurate the Vegas lines are. If favorites covered the spread (green) or overs hit (orange) well above 50% for years, simply betting that side would have been profitable. Lines hugging 50% mean the market is efficient — there is no free money in blindly betting one side."
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
              <span style={{ color: "#97999b", fontSize: 12 }}>
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
    <ChartCard
      title="Total Points Distribution"
      sub="Number of games by combined final score"
      info="Shows what a 'normal' game total looks like. Most games land in the 30–50 point range, which is why over/under lines cluster there. Use it to judge how unusual a very low- or high-scoring game is under the current filters."
    >
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
    <ChartCard
      title="Weather Impact on Scoring"
      sub="Average combined points by game-time temperature"
      info="Quantifies how conditions affect offense: freezing outdoor games score noticeably fewer points than warm or indoor ones. Handy for late-season outdoor matchups — a cold forecast is a reason to lean under the total."
    >
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
