import React, { useMemo } from "react";
import { startOfWeek, parseISO, isAfter } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Ruler, Trophy, TrendingUp } from "lucide-react";

// Last N weeks of mileage data for the chart
function getWeeklyChartData(workouts, numWeeks = 8) {
  const weeks = [];
  const now = new Date();

  for (let i = numWeeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7),
      { weekStartsOn: 1 }
    );
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const miles = workouts
      .filter((w) => {
        if (!w.date) return false;
        const d = parseISO(w.date);
        return d >= weekStart && d < weekEnd;
      })
      .reduce((sum, w) => sum + (w.distance || 0), 0);

    const label = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
    weeks.push({ week: label, miles: parseFloat(miles.toFixed(1)) });
  }
  return weeks;
}

// Current week mileage (Mon–Sun)
function currentWeekMiles(workouts) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  return workouts
    .filter((w) => w.date && isAfter(parseISO(w.date), weekStart))
    .reduce((sum, w) => sum + (w.distance || 0), 0);
}

// Best pace (lowest min/mi) across all workouts
function bestPace(workouts) {
  let best = null;
  for (const w of workouts) {
    if (w.distance > 0 && w.time_minutes > 0) {
      const pace = w.time_minutes / w.distance;
      if (best === null || pace < best) best = pace;
    }
  }
  if (best === null) return null;
  const mins = Math.floor(best);
  const secs = Math.round((best - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, "0")} /mi`;
}

// Longest single run
function longestRun(workouts) {
  return workouts.reduce((max, w) => Math.max(max, w.distance || 0), 0);
}

export default function PerformanceStats({ workouts }) {
  const weekMiles = useMemo(() => currentWeekMiles(workouts), [workouts]);
  const pb = useMemo(() => bestPace(workouts), [workouts]);
  const longest = useMemo(() => longestRun(workouts), [workouts]);
  const chartData = useMemo(() => getWeeklyChartData(workouts), [workouts]);

  if (workouts.length === 0) return null;

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={Ruler}
          label="This Week"
          value={`${weekMiles.toFixed(1)} mi`}
        />
        <StatCard
          icon={Trophy}
          label="Best Pace"
          value={pb || "—"}
        />
        <StatCard
          icon={TrendingUp}
          label="Longest Run"
          value={`${longest.toFixed(1)} mi`}
        />
      </div>

      {/* Weekly mileage chart */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm font-semibold text-foreground mb-4">Weekly Mileage (last 8 weeks)</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} barSize={24}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip
              formatter={(v) => [`${v} mi`, "Miles"]}
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
                fontSize: 12,
              }}
            />
            <Bar dataKey="miles" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1.5">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-base font-bold text-foreground leading-tight">{value}</p>
    </div>
  );
}