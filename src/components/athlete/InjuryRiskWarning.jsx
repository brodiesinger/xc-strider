import React, { useMemo } from "react";
import { ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";
import { startOfWeek, subWeeks, format, parseISO } from "date-fns";

function getWeekMiles(workouts, weekStart) {
  const start = format(weekStart, "yyyy-MM-dd");
  const end = format(new Date(weekStart.getTime() + 7 * 86400000), "yyyy-MM-dd");
  return workouts
    .filter((w) => w.date && w.date >= start && w.date < end)
    .reduce((s, w) => s + (w.distance || 0), 0);
}

function analyzeRisk(workouts) {
  if (workouts.length < 3) return { level: "safe", warnings: [] };

  const warnings = [];
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = subWeeks(thisWeekStart, 1);
  const twoWeeksStart = subWeeks(thisWeekStart, 2);

  const thisWeek = getWeekMiles(workouts, thisWeekStart);
  const lastWeek = getWeekMiles(workouts, lastWeekStart);
  const twoWeeks = getWeekMiles(workouts, twoWeeksStart);

  // 10% rule — more than 10% increase week-over-week
  if (lastWeek > 0 && thisWeek > lastWeek * 1.1) {
    const pct = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
    warnings.push({ text: `Mileage jumped ${pct}% this week vs last (${thisWeek.toFixed(1)} vs ${lastWeek.toFixed(1)} mi). Consider easing back.`, severity: "high" });
  }

  // Consecutive high-mileage days
  const sorted = [...workouts].sort((a, b) => b.date?.localeCompare(a.date));
  const recent7 = sorted.filter((w) => {
    if (!w.date) return false;
    const d = parseISO(w.date);
    return (now - d) / 86400000 <= 7;
  });
  if (recent7.length >= 7) {
    warnings.push({ text: "You've logged workouts every day this week. Consider a rest day for recovery.", severity: "medium" });
  }

  // Very long single run spike
  const avgDistance = workouts.slice(0, 20).reduce((s, w) => s + (w.distance || 0), 0) / Math.min(workouts.length, 20);
  const recentLong = recent7.find((w) => w.distance > avgDistance * 1.8);
  if (recentLong) {
    warnings.push({ text: `Recent ${recentLong.distance} mi run is significantly longer than your average (${avgDistance.toFixed(1)} mi). Allow extra recovery time.`, severity: "medium" });
  }

  // 3-week upward trend
  if (thisWeek > lastWeek && lastWeek > twoWeeks && twoWeeks > 0) {
    warnings.push({ text: "3 consecutive weeks of increasing mileage. Consider a recovery/down week soon.", severity: "low" });
  }

  const level = warnings.some((w) => w.severity === "high") ? "high"
    : warnings.some((w) => w.severity === "medium") ? "medium"
    : warnings.length ? "low"
    : "safe";

  return { level, warnings };
}

const LEVEL_CONFIG = {
  safe: { icon: ShieldCheck, color: "text-green-600", bg: "bg-green-50 border-green-200", label: "Low Injury Risk", desc: "Your training load looks healthy. Keep it up!" },
  low: { icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200", label: "Minor Risk Factors", desc: null },
  medium: { icon: ShieldAlert, color: "text-orange-500", bg: "bg-orange-50 border-orange-200", label: "Moderate Risk", desc: null },
  high: { icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/5 border-destructive/20", label: "High Injury Risk", desc: null },
};

export default function InjuryRiskWarning({ workouts }) {
  const { level, warnings } = useMemo(() => analyzeRisk(workouts), [workouts]);
  const config = LEVEL_CONFIG[level];
  const Icon = config.icon;

  if (workouts.length < 3) return null;

  return (
    <div className={`rounded-2xl border p-5 ${config.bg}`}>
      <div className="flex items-center gap-3 mb-3">
        <Icon className={`w-5 h-5 ${config.color}`} />
        <p className={`font-semibold text-sm ${config.color}`}>{config.label}</p>
      </div>
      {config.desc && <p className="text-sm text-muted-foreground">{config.desc}</p>}
      {warnings.length > 0 && (
        <ul className="space-y-1.5">
          {warnings.map((w, i) => (
            <li key={i} className="text-sm text-foreground/80 flex gap-2">
              <span className="mt-1 shrink-0">•</span>
              <span>{w.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}