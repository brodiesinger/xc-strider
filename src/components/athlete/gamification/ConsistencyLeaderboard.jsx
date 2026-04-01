import React, { useEffect, useState } from "react";
import { Trophy, Loader2 } from "lucide-react";
import { format, startOfWeek } from "date-fns";
import { base44 } from "@/api/base44Client";

function getRank(n) {
  if (n === 1) return "🥇";
  if (n === 2) return "🥈";
  if (n === 3) return "🥉";
  return `#${n}`;
}

export default function ConsistencyLeaderboard({ teamId, currentUserEmail, athletes = [] }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId || !athletes?.length) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
        const weekEnd = format(new Date(startOfWeek(new Date(), { weekStartsOn: 1 }).getTime() + 7 * 86400000), "yyyy-MM-dd");

        // Fetch all team workouts this week
        const workouts = await base44.entities.Workout.filter({ team_id: teamId }, "-date", 500).catch(() => []);
        const weekWorkouts = workouts.filter((w) => w.date && w.date >= weekStart && w.date < weekEnd);

        // Fetch schedule for this week to count assigned workouts
        const schedule = await base44.entities.PracticeSchedule.filter({ team_id: teamId }, "date", 50).catch(() => []);
        const weekSchedule = schedule.filter((s) => s.date && s.date >= weekStart && s.date < weekEnd);
        const assignedCount = Math.max(weekSchedule.length, 1); // at least 1 to avoid division by 0

        // Build per-athlete stats
        const ranked = athletes.map((a) => {
          const email = a.email;
          const logged = weekWorkouts.filter((w) => w.athlete_email === email).length;
          const pct = Math.min(100, Math.round((logged / assignedCount) * 100));
          return {
            email,
            name: a.full_name || "Unknown Athlete",
            logged,
            assigned: assignedCount,
            pct,
          };
        });

        ranked.sort((a, b) => b.pct - a.pct || b.logged - a.logged);
        setEntries(ranked);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [teamId, athletes]);

  const userRank = entries.findIndex((e) => e.email === currentUserEmail) + 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading leaderboard...</span>
      </div>
    );
  }

  if (!entries.length) {
    return <p className="text-sm text-muted-foreground text-center py-8">No athletes on the team yet.</p>;
  }

  return (
    <div className="space-y-2">
      {userRank > 0 && (
        <div className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-medium text-primary flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4" />
          You are <strong>#{userRank}</strong> this week
        </div>
      )}
      {entries.map((e, i) => {
        const isMe = e.email === currentUserEmail;
        return (
          <div
            key={e.email}
            className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors ${
              isMe ? "border-primary/40 bg-primary/5" : "border-border bg-card"
            }`}
          >
            <span className="text-lg w-8 text-center shrink-0">{getRank(i + 1)}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${isMe ? "text-primary" : "text-foreground"}`}>
                {e.name} {isMe && <span className="text-xs font-normal">(you)</span>}
              </p>
              <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${e.pct}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-bold text-foreground shrink-0">{e.pct}%</span>
          </div>
        );
      })}
    </div>
  );
}