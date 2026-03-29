import React, { useMemo } from "react";
import { Trophy, TrendingDown } from "lucide-react";
import { format, parseISO } from "date-fns";

function formatPace(minutes, distance) {
  const pace = minutes / distance;
  const mins = Math.floor(pace);
  const secs = Math.round((pace - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, "0")} /mi`;
}

function formatTime(minutes) {
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PRTracker({ workouts }) {
  const prs = useMemo(() => {
    if (!workouts.length) return [];

    // Group workouts by rounded distance to find PRs per distance
    const distanceMap = new Map();
    for (const w of workouts) {
      if (!w.distance || !w.time_minutes) continue;
      const key = w.distance.toFixed(1);
      if (!distanceMap.has(key) || w.time_minutes < distanceMap.get(key).time_minutes) {
        distanceMap.set(key, w);
      }
    }

    return Array.from(distanceMap.entries())
      .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
      .map(([dist, w]) => ({ dist: parseFloat(dist), workout: w }));
  }, [workouts]);

  // Best overall pace
  const bestPaceWorkout = useMemo(() => {
    return workouts
      .filter((w) => w.distance > 0 && w.time_minutes > 0)
      .reduce((best, w) => {
        if (!best) return w;
        return w.time_minutes / w.distance < best.time_minutes / best.distance ? w : best;
      }, null);
  }, [workouts]);

  if (!workouts.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10">
        Log workouts to track your personal records.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {bestPaceWorkout && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Best Pace (All Time)</p>
            <p className="text-xl font-bold text-primary">
              {formatPace(bestPaceWorkout.time_minutes, bestPaceWorkout.distance)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {bestPaceWorkout.distance} mi · {bestPaceWorkout.date ? format(parseISO(bestPaceWorkout.date), "MMM d, yyyy") : ""}
            </p>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <TrendingDown className="w-4 h-4 text-primary" />
          Best Times by Distance
        </h3>
        <div className="space-y-2">
          {prs.map(({ dist, workout: w }) => (
            <div
              key={dist}
              className="rounded-xl border border-border bg-card p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-foreground">{dist} mi</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {w.date ? format(parseISO(w.date), "MMM d, yyyy") : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-foreground">{formatTime(w.time_minutes)}</p>
                <p className="text-xs text-primary">{formatPace(w.time_minutes, dist)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}