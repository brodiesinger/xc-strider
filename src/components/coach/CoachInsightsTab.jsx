import React, { useState, useEffect, useMemo } from "react";
import { ChevronRight, ShieldAlert, ShieldCheck, AlertTriangle, RotateCw, Zap, Wind } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format, startOfWeek, subWeeks, parseISO } from "date-fns";


const LEVEL = {
  safe:   { label: "Low Risk",       color: "text-primary",      bg: "bg-primary/5 border-primary/20",       Icon: ShieldCheck  },
  low:    { label: "Minor Risk",      color: "text-accent",      bg: "bg-accent/5 border-accent/20",         Icon: AlertTriangle },
  medium: { label: "Moderate Risk",   color: "text-accent",      bg: "bg-accent/10 border-accent/30",        Icon: ShieldAlert  },
  high:   { label: "High Risk",       color: "text-destructive", bg: "bg-destructive/5 border-destructive/20", Icon: ShieldAlert  },
};

function getWeekMiles(workouts, weekStart) {
  const start = format(weekStart, "yyyy-MM-dd");
  const end = format(new Date(weekStart.getTime() + 7 * 86400000), "yyyy-MM-dd");
  return workouts
    .filter((w) => w.date && w.date >= start && w.date < end)
    .reduce((s, w) => s + (w.distance || 0), 0);
}

function calcRisk(workouts, checkin) {
  const warnings = [];
  let score = 0;

  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = subWeeks(thisWeekStart, 1);
  const twoWeeksStart = subWeeks(thisWeekStart, 2);

  const thisWeek = getWeekMiles(workouts, thisWeekStart);
  const lastWeek = getWeekMiles(workouts, lastWeekStart);
  const twoWeeks = getWeekMiles(workouts, twoWeeksStart);

  if (lastWeek > 0 && thisWeek > lastWeek * 1.2) {
    const pct = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
    warnings.push(`Mileage jumped ${pct}% this week (${thisWeek.toFixed(1)} vs ${lastWeek.toFixed(1)} mi).`);
    score += 3;
  } else if (lastWeek > 0 && thisWeek > lastWeek * 1.1) {
    const pct = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
    warnings.push(`Mileage increased ${pct}% this week.`);
    score += 1;
  }

  if (thisWeek > lastWeek && lastWeek > twoWeeks && twoWeeks > 0) {
    warnings.push("3 consecutive weeks of increasing mileage.");
    score += 1;
  }

  const recent7 = workouts.filter((w) => {
    if (!w.date) return false;
    return (now - parseISO(w.date)) / 86400000 <= 7;
  });
  if (recent7.length >= 7) {
    warnings.push("No rest days logged in past 7 days.");
    score += 2;
  }

  const sampleSize = Math.min(workouts.length, 20);
  const avg = sampleSize > 0 ? workouts.slice(0, 20).reduce((s, w) => s + (w.distance || 0), 0) / sampleSize : 0;
  const spike = recent7.find((w) => w.distance > avg * 1.8);
  if (spike) {
    warnings.push(`Recent ${spike.distance} mi run is well above average (${avg.toFixed(1)} mi).`);
    score += 2;
  }

  if (checkin) {
    if (checkin.soreness >= 7) { warnings.push(`High soreness (${checkin.soreness}/10).`); score += 2; }
    else if (checkin.soreness >= 5) { warnings.push(`Moderate soreness (${checkin.soreness}/10).`); score += 1; }
    if (checkin.pain >= 5) { warnings.push(`Elevated pain (${checkin.pain}/10).`); score += 3; }
    if (checkin.energy <= 3) { warnings.push(`Low energy (${checkin.energy}/10).`); score += 1; }
  }

  const level = score >= 5 ? "high" : score >= 3 ? "medium" : score >= 1 ? "low" : "safe";
  return { level, warnings, score };
}

function AthleteRiskCard({ athlete, workouts, checkin, onSelect }) {
  const { level } = useMemo(() => calcRisk(workouts, checkin), [workouts, checkin]);
  const cfg = LEVEL[level];

  return (
    <button
      onClick={onSelect}
      className="w-full text-left rounded-xl border border-border bg-card p-4 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-semibold text-foreground">{athlete.full_name || "Unknown Athlete"}</p>
          <div className="flex items-center gap-2 mt-2">
            <cfg.Icon className={`w-4 h-4 ${cfg.color}`} />
            <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </button>
  );
}

function getRecoveryRecommendation(workouts, checkin) {
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = subWeeks(thisWeekStart, 1);

  const thisWeek = getWeekMiles(workouts, thisWeekStart);
  const lastWeek = getWeekMiles(workouts, lastWeekStart);

  const recent7 = workouts.filter((w) => {
    if (!w.date) return false;
    return (now - parseISO(w.date)) / 86400000 <= 7;
  });

  // High pain or soreness = rest day
  if (checkin && (checkin.pain >= 6 || checkin.soreness >= 8)) {
    return { type: "rest", label: "Rest Day", description: "Focus on recovery. No running today.", icon: Wind };
  }

  // Large mileage jump = easy/cross training
  if (lastWeek > 0 && thisWeek > lastWeek * 1.15) {
    return { type: "cross", label: "Cross Training", description: "Easy cross training (cycling, swimming). Keep it light.", icon: RotateCw };
  }

  // 7+ consecutive days of running = rest day
  if (recent7.length >= 7) {
    return { type: "rest", label: "Rest Day", description: "No running. Take a day to recover.", icon: Wind };
  }

  // Low energy = easy run
  if (checkin && checkin.energy <= 4) {
    return { type: "easy", label: "Easy Run", description: "Short, easy run. Keep HR low and pace relaxed.", icon: Zap };
  }

  // Moderate soreness = easy run or cross training
  if (checkin && checkin.soreness >= 5) {
    return { type: "easy", label: "Easy Run", description: "Easy pace. Listen to your body.", icon: Zap };
  }

  // Default: normal training allowed
  return { type: "normal", label: "Normal Training", description: "Ready for regular training.", icon: Zap };
}

function AthleteDetailView({ athlete, workouts, checkin, onBack }) {
  const { level, warnings } = useMemo(() => calcRisk(workouts, checkin), [workouts, checkin]);
  const cfg = LEVEL[level];
  const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const thisWeek = getWeekMiles(workouts, thisWeekStart);
  const recovery = useMemo(() => getRecoveryRecommendation(workouts, checkin), [workouts, checkin]);
  const RecoveryIcon = recovery.icon;

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="text-sm text-primary hover:underline flex items-center gap-1"
      >
        ← Back to overview
      </button>

      <div>
        <h2 className="text-2xl font-bold text-foreground">{athlete.full_name || "Unknown Athlete"}</h2>
      </div>

      {/* Risk Level */}
      <div className={`rounded-2xl border p-5 ${cfg.bg}`}>
        <div className="flex items-center gap-2 mb-2">
          <cfg.Icon className={`w-5 h-5 ${cfg.color}`} />
          <span className={`font-bold text-base ${cfg.color}`}>{cfg.label}</span>
        </div>
        {warnings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Training load looks healthy.</p>
        ) : (
          <ul className="space-y-1.5">
            {warnings.map((w, i) => (
              <li key={i} className="text-sm text-foreground/80 flex gap-2">
                <span className="shrink-0 mt-0.5">•</span><span>{w}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recovery Recommendation */}
      <div className={`rounded-2xl border p-5 ${recovery.type === 'rest' ? 'bg-destructive/5 border-destructive/20' : recovery.type === 'cross' ? 'bg-accent/5 border-accent/20' : 'bg-primary/5 border-primary/20'}`}>
        <div className="flex items-center gap-2 mb-2">
          <RecoveryIcon className={`w-5 h-5 ${recovery.type === 'rest' ? 'text-destructive' : recovery.type === 'cross' ? 'text-accent' : 'text-primary'}`} />
          <span className={`font-bold text-base ${recovery.type === 'rest' ? 'text-destructive' : recovery.type === 'cross' ? 'text-accent' : 'text-primary'}`}>
            {recovery.label}
          </span>
        </div>
        <p className="text-sm text-foreground/80">{recovery.description}</p>
      </div>

      {/* Mileage Overview */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-semibold text-foreground mb-3">This Week's Mileage</h3>
        <p className="text-3xl font-bold text-primary">{thisWeek.toFixed(1)} mi</p>
      </div>

      {/* Daily Check-in */}
      {checkin && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-3">Today's Check-in</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[["Soreness", checkin.soreness, "😣"], ["Pain", checkin.pain, "🤕"], ["Energy", checkin.energy, "⚡"]].map(([lbl, val, em]) => (
              <div key={lbl} className="rounded-xl bg-muted p-3">
                <p className="text-lg">{em}</p>
                <p className="font-bold text-foreground text-lg">{typeof val === "number" ? `${val}/10` : val ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{lbl}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Workouts */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-semibold text-foreground mb-3">Recent Workouts</h3>
        {workouts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No workouts logged.</p>
        ) : (
          <div className="space-y-2">
            {workouts.slice(0, 5).map((w) => (
              <div key={w.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{w.date}</p>
                  <p className="text-xs text-muted-foreground">{w.distance} mi in {w.time_minutes} min</p>
                </div>
                <p className="text-xs text-primary font-medium">
                  {(() => { const p = w.time_minutes / w.distance; const m = Math.floor(p); const s = Math.round((p - m) * 60); return `${m}:${s.toString().padStart(2,"0")} /mi`; })()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CoachInsightsTab({ athletes, teamId }) {
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [allWorkouts, setAllWorkouts] = useState([]);
  const [checkins, setCheckins] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) {
      setLoading(false);
      return;
    }
    const init = async () => {
      setLoading(true);
      try {
        const workouts = await base44.entities.Workout.filter({ team_id: teamId }, "-date", 500);
        setAllWorkouts(workouts || []);

        const todayStr = format(new Date(), "yyyy-MM-dd");
        const allCheckins = await base44.entities.DailyCheckin.filter({ date: todayStr }, "-created_date", 100);
        const checkinMap = {};
        (allCheckins || []).forEach((c) => {
          checkinMap[c.athlete_email] = c;
        });
        setCheckins(checkinMap);
      } catch {
        setAllWorkouts([]);
        setCheckins({});
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [teamId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (selectedAthlete) {
    const athleteWorkouts = allWorkouts.filter((w) => w.athlete_email === selectedAthlete.email);
    const athleteCheckin = checkins[selectedAthlete.email] || null;
    return (
      <AthleteDetailView
        athlete={selectedAthlete}
        workouts={athleteWorkouts}
        checkin={athleteCheckin}
        onBack={() => setSelectedAthlete(null)}
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">Click on an athlete to view detailed insights.</p>
      {athletes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No athletes on your roster yet.</p>
      ) : (
        athletes.map((athlete) => {
          const athleteWorkouts = allWorkouts.filter((w) => w.athlete_email === athlete.email);
          const athleteCheckin = checkins[athlete.email] || null;
          return (
            <AthleteRiskCard
              key={athlete.email}
              athlete={athlete}
              workouts={athleteWorkouts}
              checkin={athleteCheckin}
              onSelect={() => setSelectedAthlete(athlete)}
            />
          );
        })
      )}
    </div>
  );
}