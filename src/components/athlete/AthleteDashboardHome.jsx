import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Ruler, TrendingUp, Activity, BarChart2, Lightbulb, Users, Zap } from "lucide-react";
import { startOfWeek, format } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import NotificationBell from "@/components/shared/NotificationBell";
import WorkoutList from "@/components/athlete/WorkoutList";

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

export default function AthleteDashboardHome({ user, team, workouts, onLogWorkout, onNavigate }) {
  const thisWeek = useMemo(() => {
    const startStr = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
    return workouts.filter((w) => w.date && w.date >= startStr).reduce((s, w) => s + (w.distance || 0), 0);
  }, [workouts]);

  const total = useMemo(() => workouts.reduce((s, w) => s + (w.distance || 0), 0), [workouts]);

  const avgWeekly = useMemo(() => {
    const data = getWeeklyChartData(workouts);
    const withMiles = data.filter((d) => d.miles > 0);
    return withMiles.length ? withMiles.reduce((s, d) => s + d.miles, 0) / withMiles.length : 0;
  }, [workouts]);

  const chartData = useMemo(() => getWeeklyChartData(workouts), [workouts]);

  const recentWorkouts = useMemo(() =>
    [...workouts].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 5),
  [workouts]);

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-start justify-between gap-3 pt-2"
      >
        <div>
          <p className="text-sm text-muted-foreground">Good to see you,</p>
          <h1 className="text-2xl font-bold text-foreground">
            {user?.full_name || user?.email?.split("@")[0]} 👋
          </h1>
          {team && <p className="text-sm text-primary font-medium mt-0.5">{team.name}</p>}
        </div>
        {user && <NotificationBell userEmail={user.email} />}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { Icon: Ruler, label: "This Week", value: `${thisWeek.toFixed(1)}`, unit: "mi" },
          { Icon: Activity, label: "Avg / Week", value: `${avgWeekly.toFixed(1)}`, unit: "mi" },
          { Icon: TrendingUp, label: "Total", value: `${total.toFixed(1)}`, unit: "mi" },
        ].map(({ Icon, label, value, unit }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-1">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xl font-bold text-foreground leading-tight">
              {value} <span className="text-xs font-normal text-muted-foreground">{unit}</span>
            </p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Log Workout CTA */}
      <button
        onClick={onLogWorkout}
        className="w-full rounded-2xl bg-primary text-primary-foreground p-5 flex items-center gap-4 shadow-md active:scale-[0.98] transition-transform"
      >
        <div className="w-12 h-12 rounded-full bg-primary-foreground/15 flex items-center justify-center shrink-0">
          <Plus className="w-6 h-6" />
        </div>
        <div className="text-left">
          <p className="font-bold text-lg leading-tight">Log Workout</p>
          <p className="text-sm text-primary-foreground/70">Tap to record today's run</p>
        </div>
      </button>

      {/* Chart */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm font-semibold text-foreground mb-4">Weekly Mileage</p>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={chartData} barSize={22}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={24} />
            <Tooltip
              formatter={(v) => [`${v} mi`, "Miles"]}
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: 12 }}
            />
            <Bar dataKey="miles" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            { Icon: BarChart2, label: "Performance", color: "bg-blue-100 text-blue-600", action: () => onNavigate("performance") },
            { Icon: Users, label: "Team", color: "bg-accent/15 text-accent", action: () => onNavigate("profile") },
            { Icon: Zap, label: "Recovery", color: "bg-orange-100 text-orange-500", action: () => onNavigate("insights") },
          ].map(({ Icon, label, color, action }) => (
            <button
              key={label}
              onClick={action}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all"
            >
              <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-medium text-foreground text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Recent Workouts */}
      {recentWorkouts.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recent Activity</h2>
          <WorkoutList workouts={recentWorkouts} />
        </section>
      )}
    </div>
  );
}