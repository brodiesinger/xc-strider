import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Trophy, Target } from "lucide-react";
import { format, parseISO } from "date-fns";

const GOAL_TYPES = {
  weekly_miles: { label: "Weekly Miles", unit: "mi/week" },
  total_miles: { label: "Total Miles", unit: "mi" },
  pace: { label: "Target Pace", unit: "min/mi" },
  race_distance: { label: "Race Distance", unit: "mi" },
};

function formatPace(minutes, distance) {
  if (!minutes || !distance) return "—";
  const pace = minutes / distance;
  const mins = Math.floor(pace);
  const secs = Math.round((pace - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, "0")} /mi`;
}

function formatTime(minutes) {
  if (!minutes) return "—";
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function computeGoalProgress(goal, workouts) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const weekStart_str = format(weekStart, "yyyy-MM-dd");

  switch (goal.type) {
    case "weekly_miles": {
      const val = workouts
        .filter((w) => w.date && w.date >= weekStart_str)
        .reduce((s, w) => s + (w.distance || 0), 0);
      return { current: parseFloat(val.toFixed(1)), pct: Math.min(100, (val / goal.target) * 100) };
    }
    case "total_miles": {
      const val = workouts.reduce((s, w) => s + (w.distance || 0), 0);
      return { current: parseFloat(val.toFixed(1)), pct: Math.min(100, (val / goal.target) * 100) };
    }
    case "pace": {
      const best = workouts
        .filter((w) => w.distance > 0 && w.time_minutes > 0)
        .reduce((b, w) => {
          const p = w.time_minutes / w.distance;
          return !b || p < b ? p : b;
        }, null);
      if (!best) return { current: null, pct: 0 };
      const pct = Math.min(100, (goal.target / best) * 100);
      return { current: parseFloat(best.toFixed(2)), pct };
    }
    default:
      return { current: null, pct: 0 };
  }
}

function AthletePerformanceCard({ athlete, workouts, goals, racePRs }) {

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <h3 className="font-semibold text-foreground">{athlete.full_name || athlete.email}</h3>

      {/* Goals */}
      {goals.length > 0 ? (
        <div className="space-y-2">
          {goals.map((goal) => {
            const prog = computeGoalProgress(goal, workouts);
            return (
              <div key={goal.id} className="rounded-lg border border-border bg-background p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-primary" />
                    {goal.label}
                  </p>
                  <span className="text-xs font-bold text-primary">
                    {goal.type === "pace"
                      ? `${formatTime(prog.current * 60)} / ${formatTime(goal.target * 60)}`
                      : `${prog.current} / ${goal.target}`}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${prog.pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No goals set</p>
      )}

      {/* Race PRs */}
      {racePRs.length > 0 ? (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1 text-muted-foreground">
            <Trophy className="w-3.5 h-3.5" />
            Race PRs
          </p>
          {racePRs.map((pr) => (
            <div key={pr.id} className="flex items-center justify-between text-xs rounded-lg bg-primary/5 border border-primary/20 p-2">
              <span className="font-medium text-foreground">{pr.distance}</span>
              <span className="text-primary font-bold">{formatTime(pr.time_minutes)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No race PRs recorded</p>
      )}
    </div>
  );
}

export default function CoachPerformanceTab({ athletes, teamId }) {
  const [athleteData, setAthleteData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = {};
      for (const athlete of athletes) {
        const [workouts, goals, racePRs] = await Promise.all([
          base44.entities.Workout.filter({ athlete_email: athlete.email }, "-date", 100).catch(() => []),
          base44.entities.Goal.filter({ athlete_email: athlete.email }, "-created_date", 20).catch(() => []),
          base44.entities.RacePR.filter({ athlete_email: athlete.email }, "-created_date", 20).catch(() => []),
        ]);
        data[athlete.email] = { workouts, goals, racePRs };
      }
      setAthleteData(data);
      setLoading(false);
    };
    loadData();
  }, [athletes, teamId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (athletes.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No athletes in this team yet.</p>;
  }

  return (
    <div className="space-y-4">
      {athletes.map((athlete) => (
        <AthletePerformanceCard
          key={athlete.email}
          athlete={athlete}
          workouts={athleteData[athlete.email]?.workouts || []}
          goals={athleteData[athlete.email]?.goals || []}
          racePRs={athleteData[athlete.email]?.racePRs || []}
        />
      ))}
    </div>
  );
}