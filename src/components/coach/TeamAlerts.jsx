import React, { useMemo, useState } from "react";
import { format, startOfWeek, subWeeks, parseISO } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── helpers ────────────────────────────────────────────────────────────────

function getWeekMiles(workouts, weekStart) {
  const start = format(weekStart, "yyyy-MM-dd");
  const end = format(new Date(weekStart.getTime() + 7 * 86400000), "yyyy-MM-dd");
  return workouts.filter((w) => w.date && w.date >= start && w.date < end);
}

function calcInjuryScore(workouts, checkin) {
  let score = 0;
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = subWeeks(thisWeekStart, 1);

  const thisWk = getWeekMiles(workouts, thisWeekStart).reduce((s, w) => s + (w.distance || 0), 0);
  const lastWk = getWeekMiles(workouts, lastWeekStart).reduce((s, w) => s + (w.distance || 0), 0);

  if (lastWk > 0 && thisWk > lastWk * 1.2) score += 3;
  const recent7 = workouts.filter((w) => {
    if (!w.date) return false;
    try {
      return (now - parseISO(w.date)) / 86400000 <= 7;
    } catch {
      return false;
    }
  });
  if (recent7.length >= 7) score += 2;
  const sampleSize = Math.min(workouts.length, 20);
  const avg = sampleSize > 0 ? workouts.slice(0, 20).reduce((s, w) => s + (w.distance || 0), 0) / sampleSize : 0;
  if (recent7.find((w) => w.distance > avg * 1.8)) score += 2;
  if (checkin) {
    if (checkin.soreness >= 7) score += 2;
    if (checkin.pain >= 5) score += 3;
    if (checkin.energy <= 3) score += 1;
  }
  return score;
}

// ─── alert computation ───────────────────────────────────────────────────────

function computeAlerts({ athletes, workouts, checkins, schedule }) {
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = subWeeks(thisWeekStart, 1);

  const thisWeekWorkouts = getWeekMiles(workouts, thisWeekStart);
  const lastWeekWorkouts = getWeekMiles(workouts, lastWeekStart);

  const thisCount = thisWeekWorkouts.length;
  const lastCount = lastWeekWorkouts.length;

  const alerts = [];

  // ── A: Missed workouts ───────────────────────────────────────────────────
  const scheduledThisWeek = schedule.filter((s) => {
    if (!s.date) return false;
    const d = s.date;
    const start = format(thisWeekStart, "yyyy-MM-dd");
    const end = format(new Date(thisWeekStart.getTime() + 7 * 86400000), "yyyy-MM-dd");
    return d >= start && d < end;
  });

  if (scheduledThisWeek.length > 0 && athletes.length > 0) {
    const athletesWithMissed = athletes.filter((a) => {
      const logged = thisWeekWorkouts.filter((w) => w.athlete_email === a.email).length;
      return scheduledThisWeek.length - logged >= 2;
    });
    if (athletesWithMissed.length > 0) {
      alerts.push({
        id: "missed_workouts",
        severity: "warning",
        icon: "⚠️",
        message: `${athletesWithMissed.length} athlete${athletesWithMissed.length > 1 ? "s" : ""} missed multiple workouts this week`,
        detail: athletesWithMissed.map((a) => a.full_name || a.email),
      });
    }
  }

  // ── B: Low team consistency ──────────────────────────────────────────────
  if (athletes.length > 0 && scheduledThisWeek.length > 0) {
    const totalPossible = athletes.length * scheduledThisWeek.length;
    const totalLogged = thisWeekWorkouts.length;
    const consistency = totalLogged / totalPossible;
    if (consistency < 0.7) {
      alerts.push({
        id: "low_consistency",
        severity: "warning",
        icon: "📉",
        message: `Team consistency is below 70% this week (${Math.round(consistency * 100)}%)`,
        detail: null,
      });
    } else if (consistency >= 0.85 && lastWeekWorkouts.length > 0) {
      const lastConsistency = lastWeekWorkouts.length / totalPossible;
      if (consistency > lastConsistency) {
        alerts.push({
          id: "positive_momentum",
          severity: "positive",
          icon: "🔥",
          message: `Team consistency is improving this week (${Math.round(consistency * 100)}%)`,
          detail: null,
        });
      }
    }
  }

  // ── C: High injury risk ──────────────────────────────────────────────────
  const highRiskAthletes = athletes.filter((a) => {
    const aw = workouts.filter((w) => w.athlete_email === a.email);
    const checkin = checkins[a.email] || null;
    return calcInjuryScore(aw, checkin) >= 5;
  });
  if (highRiskAthletes.length > 0) {
    alerts.push({
      id: "high_injury_risk",
      severity: "urgent",
      icon: "🚨",
      message: `${highRiskAthletes.length} athlete${highRiskAthletes.length > 1 ? "s are" : " is"} at high injury risk`,
      detail: highRiskAthletes.map((a) => a.full_name || a.email),
    });
  }

  // ── D: Sudden drop in activity ───────────────────────────────────────────
  if (lastCount > 0 && thisCount < lastCount * 0.85) {
    const drop = Math.round(((lastCount - thisCount) / lastCount) * 100);
    alerts.push({
      id: "activity_drop",
      severity: "warning",
      icon: "📉",
      message: `Team activity dropped ${drop}% compared to last week`,
      detail: null,
    });
  }

  // ── E: High soreness trend ───────────────────────────────────────────────
  const soreness = Object.values(checkins).filter((c) => c.soreness >= 7);
  if (soreness.length >= 2) {
    alerts.push({
      id: "high_soreness",
      severity: "warning",
      icon: "⚠️",
      message: `${soreness.length} athletes are reporting high soreness levels`,
      detail: null,
    });
  }

  // Sort: urgent → warning → positive; cap at 5
  const order = { urgent: 0, warning: 1, positive: 2 };
  return alerts.sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 5);
}

// ─── severity styles ─────────────────────────────────────────────────────────

const SEVERITY_STYLE = {
  urgent:   { border: "border-red-200",    bg: "bg-red-50 dark:bg-red-950/30",    dot: "bg-red-500",    text: "text-red-700 dark:text-red-400" },
  warning:  { border: "border-yellow-200", bg: "bg-yellow-50 dark:bg-yellow-950/20", dot: "bg-yellow-500", text: "text-yellow-800 dark:text-yellow-300" },
  positive: { border: "border-green-200",  bg: "bg-green-50 dark:bg-green-950/20", dot: "bg-green-500",  text: "text-green-700 dark:text-green-400" },
};

// ─── single alert card ───────────────────────────────────────────────────────

function AlertCard({ alert, athletes, onAthleteClick }) {
  const [expanded, setExpanded] = useState(false);
  const s = SEVERITY_STYLE[alert.severity];
  const hasDetail = alert.detail && alert.detail.length > 0;

  // Map detail names to athlete objects for clicking
  const detailAthletes = hasDetail
    ? alert.detail
        .map((name) => athletes.find((a) => (a.full_name || a.email) === name))
        .filter(Boolean)
    : [];

  return (
    <div className={`rounded-xl border ${s.border} ${s.bg} overflow-hidden`}>
      <button
        className="w-full flex items-center gap-3 p-3.5 text-left"
        onClick={() => hasDetail && setExpanded((v) => !v)}
        disabled={!hasDetail}
      >
        <span className="text-lg leading-none">{alert.icon}</span>
        <p className={`flex-1 text-sm font-medium ${s.text}`}>{alert.message}</p>
        {hasDetail && (
          expanded
            ? <ChevronUp className={`w-4 h-4 shrink-0 ${s.text}`} />
            : <ChevronDown className={`w-4 h-4 shrink-0 ${s.text}`} />
        )}
      </button>
      <AnimatePresence>
        {expanded && hasDetail && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 flex flex-wrap gap-1.5">
              {detailAthletes.map((athlete) => (
                <button
                  key={athlete.email}
                  onClick={() => onAthleteClick(athlete)}
                  className={`text-xs font-medium px-2 py-0.5 rounded-full border ${s.border} ${s.text} bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 transition-colors cursor-pointer`}
                >
                  {athlete.full_name || athlete.email}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── main export ─────────────────────────────────────────────────────────────

export default function TeamAlerts({ athletes, workouts, checkins, schedule, onAthleteClick }) {
  const alerts = useMemo(
    () => computeAlerts({ athletes, workouts, checkins, schedule }),
    [athletes, workouts, checkins, schedule]
  );

  if (athletes.length === 0) return null;

  return (
    <section>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Team Alerts
      </h2>
      {alerts.length === 0 ? (
        <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/20 p-4 flex items-center gap-3">
          <span className="text-lg">✅</span>
          <p className="text-sm font-medium text-green-700 dark:text-green-400">Everything looks good — no alerts right now.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} athletes={athletes} onAthleteClick={onAthleteClick} />
          ))}
        </div>
      )}
    </section>
  );
}