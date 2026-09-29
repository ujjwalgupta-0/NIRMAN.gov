"use client";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { THRESHOLDS, pp } from "@/lib/risk";
import { CHART, CHART_TICK, CHART_TOOLTIP } from "@/lib/chartTheme";

export default function RiskTrajectory({ history }) {
  const change = history.length >= 4 ? history.at(-1).risk - history.at(-4).risk : null;
  return (
    <div>
      <div className="h-72 -ml-2">
        <ResponsiveContainer>
          <AreaChart data={history} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={CHART.grid} strokeDasharray="2 3" vertical={false} />
            <XAxis dataKey="period" tick={CHART_TICK} tickLine={false} axisLine={{ stroke: CHART.axis }} minTickGap={16} />
            <YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tickFormatter={(value) => `${value}%`} tick={CHART_TICK} tickLine={false} axisLine={false} width={46} />
            <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, "Risk"]} contentStyle={CHART_TOOLTIP} />
            <ReferenceLine y={THRESHOLDS.red} stroke="#9aa4ac" strokeDasharray="3 4"
              label={{ value: `Severe >${THRESHOLDS.red}%`, position: "insideTopRight", fontSize: 10, fill: CHART.muted }} />
            <ReferenceLine y={THRESHOLDS.amber} stroke="#9aa4ac" strokeDasharray="3 4"
              label={{ value: `Elevated >${THRESHOLDS.amber}%`, position: "insideBottomRight", fontSize: 10, fill: CHART.muted }} />
            <Area type="monotone" dataKey="risk" stroke={CHART.primary} strokeWidth={2} fill={CHART.primary} fillOpacity={0.07} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-sm text-ink-700 mt-3">{change == null
        ? "Fewer than four dated assessments are available; 90-day movement cannot be calculated."
        : <>Risk moved <span className="font-semibold">{pp(change)}</span> over the last 90 days of monitoring.</>}</p>
    </div>
  );
}
