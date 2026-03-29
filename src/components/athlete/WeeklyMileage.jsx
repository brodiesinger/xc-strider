import React, { useMemo } from "react";
import { startOfWeek, format, parseISO } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Ruler, TrendingUp, Activity } from "lucide-react";
import WorkoutForm from "./WorkoutForm";
import WorkoutList from "./WorkoutList";

function getWeeklyChartData(workouts, numWeeks = 8) {
  const now = new Date();
  return Array.from({ length: numWeeks }, (_, i) => {
    const weekStart = startOfWeek(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - (numWeeks - 1 - i) * 7),
      { weekStartsOn: 1 }
    );
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const startStr = format(weekStart, "yyyy-MM-dd");
    const endStr = format(weekEnd, "yyyy-MM-dd");
    const miles = workouts
      .filter((w) => w.date && w.date >= startStr && w.date < endStr)
      .reduce((sum, w) => sum + (w.distance || 0), 0);
    return { week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`, miles: parseFloat(miles.toFixed(1)) };
  });
}

function currentWeekMiles(workouts) {
  const startStr = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  return workouts.filter((w) => w.date && w.date >= startStr).reduce((s, w) => s + (w.distance || 0), 0);
}

function totalMiles(workouts) {
  return workouts.reduce((s, w) => s + (w.distance || 0), 0);
}

export default function WeeklyMileage({ workouts, onSaved, teamId }) {
  const thisWeek = useMemo(() => currentWeekMiles(workouts), [workouts]);
  const total = useMemo(() => totalMiles(workouts), [workouts]);
  const avgWeekly = useMemo(() => {
    const data = getWeeklyChartData(workouts);
    const withMiles = data.filter((d) => d.miles > 0);
    return withMiles.length ? withMiles.reduce((s, d) => s + d.miles, 0) / withMiles.length : 0;
  }, [workouts]);
  const chartData = useMemo(() => getWeeklyChartData(workouts), [workouts]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Ruler} label="This Week" value={`${thisWeek.toFixed(1)} mi`} />
        <StatCard icon={Activity} label="Avg / Week" value={`${avgWeekly.toFixed(1)} mi`} />
        <StatCard icon={TrendingUp} label="Total Miles" value={`${total.toFixed(1)} mi`} />
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm font-semibold text-foreground mb-4">Weekly Mileage (last 8 weeks)</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} barSize={24}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={28} />
            <Tooltip
              formatter={(v) => [`${v} mi`, "Miles"]}
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: 12 }}
            />
            <Bar dataKey="miles" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Log workout */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold text-foreground mb-5">Log a Workout</h2>
        <WorkoutForm onSaved={onSaved} teamId={teamId} />
      </div>

      {/* History */}
      <div>
        <h2 className="font-semibold text-foreground mb-4">Workout History</h2>
        <WorkoutList workouts={workouts} />
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